/* ============================================================
   THE HIDDEN GAP — PRESENTER-CONTROLLED CINEMATIC ENGINE
   FIXED: race-condition bug on Back(←)/Replay(R) that caused
   two execution loops to run simultaneously (double audio,
   skipped/duplicated beats, glitches). Fixed with a run-token
   guard: every _runFrom() call gets a unique token; if a newer
   run starts, the older loop detects it and stops itself.
   ============================================================ */

(() => {
  "use strict";

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  const addIn = (el) => el && el.classList.add("in");

  /* ============================================================
     AUDIO BED
     ============================================================ */
  class AudioBed {
    constructor() {
      this.ctx = null; this.master = null; this.drone = null;
      this.filter = null; this.on = false; this.muted = false;
    }
    init() {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        if (this.ctx.state === "suspended") this.ctx.resume();
        this.on = true;
        this._startDrone();
      } catch (e) {}
    }
    _startDrone() {
      const now = this.ctx.currentTime;
      this.master = this.ctx.createGain();
      this.master.gain.setValueAtTime(0.0001, now);
      this.master.gain.linearRampToValueAtTime(0.16, now + 3);
      this.master.connect(this.ctx.destination);
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.setValueAtTime(180, now);
      this.filter.connect(this.master);
      this.drone = this.ctx.createOscillator();
      this.drone.type = "sawtooth";
      this.drone.frequency.setValueAtTime(55, now);
      this.drone.connect(this.filter);
      this.drone.start(now);
    }
    setMood(mood) {
      if (!this.on) return;
      const now = this.ctx.currentTime;
      const map = { mystery: 55, investigate: 65, tense: 49, hopeful: 98, warm: 130 };
      const freq = map[mood] || 65;
      this.drone.frequency.linearRampToValueAtTime(freq, now + 2.5);
      this.filter.frequency.linearRampToValueAtTime(mood === "tense" ? 320 : 200, now + 2.5);
    }
    ping(freq = 700, dur = 0.12, vol = 0.05) {
      if (!this.on || this.muted) return;
      const now = this.ctx.currentTime;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(vol, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(now); o.stop(now + dur);
    }
    thud() {
      if (!this.on || this.muted) return;
      const now = this.ctx.currentTime;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(140, now);
      o.frequency.exponentialRampToValueAtTime(30, now + 0.7);
      g.gain.setValueAtTime(0.3, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(now); o.stop(now + 0.8);
    }
    toggleMute() {
      this.muted = !this.muted;
      if (this.master) {
        const now = this.ctx.currentTime;
        this.master.gain.linearRampToValueAtTime(this.muted ? 0.0001 : 0.16, now + 0.4);
      }
      return this.muted;
    }
    fadeOut(dur = 3) {
      if (!this.on || !this.master) return;
      this.master.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    }
  }

  /* ============================================================
     PARTICLE FIELD — runs forever regardless of beat state
     ============================================================ */
  class ParticleField {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext("2d");
      this.particles = []; this.color = "45,212,200";
      this._resize();
      window.addEventListener("resize", () => this._resize());
      this._seed(); this._loop();
    }
    _resize() { this.w = this.canvas.width = innerWidth; this.h = this.canvas.height = innerHeight; }
    _seed() {
      this.particles = Array.from({ length: 70 }, () => ({
        x: Math.random() * this.w, y: Math.random() * this.h,
        r: Math.random() * 1.8 + 0.4, a: Math.random() * 0.35 + 0.05,
        vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12,
      }));
    }
    setColor(rgb) { this.color = rgb; }
    _loop() {
      this.ctx.clearRect(0, 0, this.w, this.h);
      for (const p of this.particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = this.w; if (p.x > this.w) p.x = 0;
        if (p.y < 0) p.y = this.h; if (p.y > this.h) p.y = 0;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${this.color}, ${p.a})`;
        this.ctx.fill();
      }
      requestAnimationFrame(() => this._loop());
    }
  }

  /* ============================================================
     PRESENTER GATE — await this.gate.wait() blocks the story
     until SPACE / → is pressed by the presenter.
     ============================================================ */
  class PresenterGate {
    constructor() { this._resolve = null; }
    wait() { return new Promise((resolve) => { this._resolve = resolve; }); }
    advance() { if (this._resolve) { const r = this._resolve; this._resolve = null; r("next"); } }
  }

  /* ============================================================
     STAGE DIRECTOR — scenes are arrays of BEAT functions.
     ============================================================ */
  class StageDirector {
    constructor() {
      this.stages = $$(".stage");
      this.audio = new AudioBed();
      this.field = new ParticleField("fx-canvas");
      this.gate = new PresenterGate();

      this.beats = [];
      this.beatIndex = -1;
      this.currentSceneId = null;
      this.busy = false;

      /* FIX: run-token guard prevents two concurrent _runFrom loops
         (this was the bug causing double audio / broken back-replay) */
      this.runToken = 0;

      this._buildBeatList();
      this._bindControls();
      this._initHUD();
    }

    /* ---------- HUD (bottom-right, ~20% opacity) ---------- */
    _initHUD() {
      const hud = document.createElement("div");
      hud.id = "presenter-hud";
      hud.innerHTML = `
        <div class="hud-inner">
          <span id="hud-scene-label">Scene 1 / ${this.beats.length}</span>
          <div class="hud-bar"><div class="hud-bar-fill" id="hud-bar-fill"></div></div>
          <span class="hud-hint">Press Space</span>
        </div>`;
      document.body.appendChild(hud);
      this._updateHUD();
    }
    _updateHUD() {
      const label = $("#hud-scene-label");
      const fill = $("#hud-bar-fill");
      if (!label || !fill) return;
      label.textContent = `Scene ${Math.min(this.beatIndex + 1, this.beats.length)} / ${this.beats.length}`;
      fill.style.width = `${((this.beatIndex + 1) / this.beats.length) * 100}%`;
    }

    /* ---------- Keyboard controls ---------- */
    _bindControls() {
      window.addEventListener("keydown", (e) => {
        const k = e.key;
        if (k === " " || k === "ArrowRight") { e.preventDefault(); this._onAdvance(); }
        else if (k === "ArrowLeft")           { e.preventDefault(); this._onBack(); }
        else if (k.toLowerCase() === "r")     { this._onReplay(); }
        else if (k.toLowerCase() === "f")     { this._toggleFullscreen(); }
        else if (k.toLowerCase() === "m")     { this.audio.toggleMute(); }
        else if (k === "Escape") { if (document.fullscreenElement) document.exitFullscreen(); }
      });
    }
    _onAdvance() {
      if (this.busy) return;
      this.gate.advance();
    }
    _onBack() {
      if (this.beatIndex <= 0) return;
      const targetScene = this.beats[this.beatIndex - 1].sceneId;
      let start = this.beatIndex - 1;
      while (start > 0 && this.beats[start - 1].sceneId === targetScene) start--;
      this._jumpTo(start);
    }
    _onReplay() {
      const scene = this.beats[this.beatIndex]?.sceneId;
      if (!scene) return;
      let start = this.beatIndex;
      while (start > 0 && this.beats[start - 1].sceneId === scene) start--;
      this._jumpTo(start);
    }
    _toggleFullscreen() {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    }

    /* FIX: _jumpTo now invalidates the currently-running loop
       (via runToken) BEFORE releasing its gate, so the old loop
       sees the token mismatch and exits instead of continuing
       to run alongside the new one. */
    _jumpTo(index) {
      this.runToken++;              // invalidate any active _runFrom loop
      this.beatIndex = index - 1;
      this.gate.advance();          // release old loop's wait (it will see token mismatch and stop)
      this._runFrom(index, this.runToken);
    }

    /* ---------- Beat registration helper ---------- */
    _beat(sceneId, fn) { this.beats.push({ sceneId, fn }); }

    /* ============================================================
       SCENE DEFINITIONS AS BEATS
       ============================================================ */
    _buildBeatList() {

      /* ---------------- SCENE: TITLE ---------------- */
      this._beat("title", async () => {
        this.goTo("stage-title");
        this.audio.setMood("mystery");
        addIn($("#rig-title"));
        $("#rig-title .student-rig")?.classList.add("anim-idle");
        await wait(500);
        addIn($(".l-1")); this.audio.ping(660);
      });
      this._beat("title", async () => { addIn($(".l-1b")); });
      this._beat("title", async () => { addIn($(".l-2")); });
      this._beat("title", async () => { addIn($(".l-3")); });
      this._beat("title", async () => { addIn($(".l-4")); this.audio.ping(880); });
      this._beat("title", async () => { addIn($(".l-5")); });

      /* ---------------- SCENE: ROOM (the hook) ---------------- */
      this._beat("room", async () => {
        this.goTo("stage-room");
        this.audio.setMood("investigate");
        addIn($("#rig-room"));
        $("#room-arm").classList.add("typing");
      });
      this._beat("room", async () => {
        const rows = $$(".log-row");
        for (const row of rows.slice(0, 3)) { addIn(row); this.audio.ping(720, 0.1, 0.04); await wait(300); }
        $$(".sticky").forEach((s) => s.classList.add("visible"));
      });
      this._beat("room", async () => {
        addIn($$(".log-row")[3]);
        await this._countUp("#hours-counter", 0, 14, 1400);
      });
      this._beat("room", async () => {
        $("#apps-tracker").classList.add("in");
        await this._countUp("#apps-number", 0, 50, 1200);
        $("#apps-fill").style.width = "85%";
      });
      this._beat("room", async () => {
        $("#inbox-panel").classList.add("in");
        await wait(600);
        $("#inbox-empty").style.display = "none";
        $("#inbox-msg-1").classList.add("visible");
        $("#room-arm").classList.remove("typing");
        $("#ambient-glow").classList.add("mode-reject");
        this.audio.thud();
      });

      /* ---------------- SCENE: THE QUESTION ---------------- */
      this._beat("question", async () => {
        this.goTo("stage-question");
        $("#ambient-glow").classList.remove("mode-reject");
        this.audio.setMood("investigate");
        const grid = $("#crowd-grid");
        if (!grid.childElementCount) {
          for (let i = 0; i < 72; i++) { const d = document.createElement("div"); d.className = "silhouette"; grid.appendChild(d); }
        }
        addIn(grid);
      });
      this._beat("question", async () => { addIn($(".q1")); });
      this._beat("question", async () => { addIn($(".q2")); });

      /* ---------------- SCENE: DATASET 1 — STUDENT SURVEY ---------------- */
      this._beat("dataset1", async () => {
        this.goTo("stage-dataset1");
        this.audio.setMood("investigate");
        addIn($("#form-stream .fc1")); this.audio.ping(700);
      });
      this._beat("dataset1", async () => { addIn($("#form-stream .fc2")); this.audio.ping(700); });
      this._beat("dataset1", async () => { addIn($("#form-stream .fc3")); this.audio.ping(700); });
      this._beat("dataset1", async () => {
        addIn($("#sample-overview-panel"));
        this.audio.ping(760);
      });
      this._beat("dataset1", async () => { addIn($("#db-grid-reveal")); });
      this._beat("dataset1", async () => { addIn($("#stamp-1")); this.audio.ping(900, 0.15, 0.06); });

      /* ---------------- SCENE: DATASET 2 — JOB MARKET ---------------- */
      this._beat("dataset2", async () => {
        this.goTo("stage-dataset2");
        const chips = $$("#platform-row .platform-chip");
        for (const c of chips) { addIn(c); this.audio.ping(650); await wait(200); }
      });
      this._beat("dataset2", async () => {
        addIn($("#entry-level-callout"));
      });
      this._beat("dataset2", async () => {
        const nodes = $$("#ai-pipeline .pipe-node");
        nodes[0].classList.add("active");
      });
      this._beat("dataset2", async () => {
        $$("#ai-pipeline .pipe-arrow")[0].classList.add("flowing");
        $$("#ai-pipeline .pipe-node")[1].classList.add("active");
        this.audio.ping(760);
      });
      this._beat("dataset2", async () => {
        $$("#ai-pipeline .pipe-arrow")[1].classList.add("flowing");
        $$("#ai-pipeline .pipe-node")[2].classList.add("active");
        this.audio.ping(820);
      });
      this._beat("dataset2", async () => {
        const lines = $$("#terminal-box .term-line");
        for (const l of lines) { addIn(l); this.audio.ping(600, 0.08, 0.035); await wait(250); }
      });
      this._beat("dataset2", async () => {
        addIn($("#job-fields-panel"));
      });
      this._beat("dataset2", async () => {
        addIn($("#stamp-2")); this.audio.ping(900, 0.15, 0.06);
      });

      /* ---------------- SCENE: COLLISION ---------------- */
      this._beat("collide", async () => {
        this.goTo("stage-collide");
        this.audio.setMood("tense");
        $("#galaxy-left").style.opacity = "1"; $("#galaxy-right").style.opacity = "1";
      });
      this._beat("collide", async () => {
        $("#galaxy-left").classList.add("collided");
        $("#galaxy-right").classList.add("collided");
        await wait(1400);
        $("#collision-flash").classList.add("flash");
        this.audio.thud();
        await wait(150);
        $("#collision-flash").classList.remove("flash");
      });
      this._beat("collide", async () => { addIn($("#collide-caption")); });

      /* ---------------- SCENE: SKILL GAP (Finding 1) ---------------- */
      this._beat("gap", async () => {
        this.goTo("stage-gap");
        this.audio.setMood("investigate");
      });
      const gapRows = () => $$("#gap-chart .gap-row");
      this._beat("gap", async () => { addIn(gapRows()[0]); this.audio.ping(700, 0.15, 0.05); });
      this._beat("gap", async () => { addIn(gapRows()[1]); this.audio.ping(700, 0.15, 0.05); });
      this._beat("gap", async () => { addIn(gapRows()[2]); this.audio.ping(700, 0.15, 0.05); });
      this._beat("gap", async () => { addIn(gapRows()[3]); this.audio.ping(700, 0.15, 0.05); });
      this._beat("gap", async () => { addIn(gapRows()[4]); this.audio.ping(700, 0.15, 0.05); });
      this._beat("gap", async () => {
        $(".gap-legend").style.opacity = "1";
        addIn($("#gap-caption"));
      });

      /* ---------------- SCENE: EFFORT VS RESULTS (Finding 2) ---------------- */
      this._beat("effort", async () => {
        this.goTo("stage-effort");
        this.audio.setMood("tense");
        $("#effort-line").classList.add("drawn");
        $("#effort-line-glow").classList.add("drawn");
      });
      this._beat("effort", async () => { $("#pt1").classList.add("on"); addIn($("#callout1")); this.audio.ping(560,0.15,0.05); });
      this._beat("effort", async () => { $("#pt2").classList.add("on"); addIn($("#callout2")); this.audio.ping(520,0.15,0.05); });
      this._beat("effort", async () => { $("#pt3").classList.add("on"); addIn($("#callout3")); this.audio.ping(480,0.15,0.05); });
      this._beat("effort", async () => { $("#pt4").classList.add("on"); addIn($("#callout4")); this.audio.ping(440,0.15,0.05); });
      this._beat("effort", async () => { $("#stat-strip").classList.add("in"); });
      this._beat("effort", async () => { addIn($("#effort-caption")); this.audio.thud(); });

      /* ---------------- SCENE: CONVERSION FUNNEL (Finding 3) ---------------- */
      const funnelRows = () => $$("#funnel-wrap .funnel-row");
      this._beat("funnel", async () => {
        this.goTo("stage-funnel");
        const r = funnelRows()[0]; r.querySelector(".fn-fill").style.width = r.dataset.w + "%"; this.audio.ping(650,0.12,0.045);
      });
      this._beat("funnel", async () => {
        const r = funnelRows()[1]; r.querySelector(".fn-fill").style.width = r.dataset.w + "%"; this.audio.ping(650,0.12,0.045);
      });
      this._beat("funnel", async () => {
        const r = funnelRows()[2]; r.querySelector(".fn-fill").style.width = r.dataset.w + "%"; this.audio.ping(650,0.12,0.045);
      });
      this._beat("funnel", async () => {
        const r = funnelRows()[3]; r.querySelector(".fn-fill").style.width = r.dataset.w + "%"; this.audio.ping(650,0.12,0.045);
      });
      this._beat("funnel", async () => { $("#drop-flag").classList.add("in"); this.audio.thud(); });

      /* ---------------- SCENE: STATISTICAL TESTS (Finding 4) ---------------- */
      this._beat("stats", async () => {
        this.goTo("stage-stats");
        this.audio.setMood("investigate");
      });
      this._beat("stats", async () => { addIn($("#stat-confirmed")); this.audio.ping(700); });
      this._beat("stats", async () => { addIn($("#stat-underpowered")); this.audio.ping(660); });
      this._beat("stats", async () => { addIn($("#stat-null")); this.audio.ping(600); });

      /* ---------------- SCENE: PERSONAS (Finding 5) ---------------- */
      const personaCards = () => $$("#persona-row .persona-card");
      this._beat("personas", async () => { this.goTo("stage-personas"); this.audio.setMood("investigate"); });
      this._beat("personas", async () => { addIn(personaCards()[0]); this.audio.ping(700); });
      this._beat("personas", async () => { addIn(personaCards()[1]); this.audio.ping(700); });
      this._beat("personas", async () => { addIn(personaCards()[2]); this.audio.ping(700); });
      this._beat("personas", async () => { addIn(personaCards()[3]); this.audio.ping(700); });
      this._beat("personas", async () => {
        personaCards().forEach((c) => c.classList.add("converge"));
        this.audio.ping(880, 0.2, 0.06);
      });
      this._beat("personas", async () => { addIn($("#persona-caption")); });

      /* ---------------- SCENE: DASHBOARD ---------------- */
      this._beat("dashboard", async () => {
        this.goTo("stage-dashboard");
        this.audio.setMood("hopeful");
      });
      this._beat("dashboard", async () => { addIn($("#dash-sheet-1")); this.audio.ping(720); });
      this._beat("dashboard", async () => { addIn($("#dash-sheet-2")); this.audio.ping(720); });
      this._beat("dashboard", async () => { addIn($("#dash-sheet-3")); this.audio.ping(720); });
      this._beat("dashboard", async () => { addIn($("#dash-sheet-4")); this.audio.ping(720); });
      this._beat("dashboard", async () => { addIn($("#dash-sheet-5")); this.audio.ping(720); });
      this._beat("dashboard", async () => { addIn($("#dash-sheet-6")); this.audio.ping(720); });

      /* ---------------- SCENE: RECOMMENDATIONS ---------------- */
      const missions = () => $$("#mission-list .mission");
      this._beat("recs", async () => { this.goTo("stage-recs"); this.audio.setMood("hopeful"); });
      this._beat("recs", async () => { addIn(missions()[0]); this.audio.ping(760,0.12,0.05); });
      this._beat("recs", async () => { addIn(missions()[1]); this.audio.ping(760,0.12,0.05); });
      this._beat("recs", async () => { addIn(missions()[2]); this.audio.ping(760,0.12,0.05); });
      this._beat("recs", async () => { addIn(missions()[3]); this.audio.ping(760,0.12,0.05); });
      this._beat("recs", async () => { addIn(missions()[4]); this.audio.ping(760,0.12,0.05); });

      /* ---------------- SCENE: RESOLUTION ---------------- */
      this._beat("final", async () => {
        this.goTo("stage-final");
        this.audio.setMood("warm");
        $("#ambient-glow").classList.remove("mode-reject");
        $("#ambient-glow").classList.add("mode-warm");
        $("#sunrise-scene").classList.add("in");
        addIn($("#rig-final"));
        $("#rig-final .student-rig").classList.add("anim-walk");
        $("#rig-final .char-head").classList.add("hopeful");
      });
      this._beat("final", async () => { $("#dissolving-rejects").classList.add("dissolved"); });
      this._beat("final", async () => { addIn($(".qline-1")); this.audio.ping(600, 0.2, 0.04); });
      this._beat("final", async () => { addIn($(".qline-2")); this.audio.ping(660, 0.2, 0.04); });
      this._beat("final", async () => { addIn($("#team-member-1")); this.audio.ping(700, 0.12, 0.035); });
      this._beat("final", async () => { addIn($("#team-member-2")); this.audio.ping(700, 0.12, 0.035); });
      this._beat("final", async () => { addIn($("#team-member-3")); this.audio.ping(700, 0.12, 0.035); });
      this._beat("final", async () => { addIn($("#team-member-4")); this.audio.ping(700, 0.12, 0.035); });
      this._beat("final", async () => { $("#credits").classList.add("in"); this.audio.ping(880, 0.2, 0.05); });
      this._beat("final", async () => { addIn($("#thank-you-line")); this.audio.fadeOut(4); });
    }

    /* ---------- Stage crossfade (visual only — unchanged look) ---------- */
    goTo(id) {
      if (this.currentSceneId === id) return;
      this.currentSceneId = id;
      this.stages.forEach((s) => s.classList.remove("stage-active"));
      document.getElementById(id).classList.add("stage-active");
    }

    /* ---------- Main run loop: beat → gate.wait() → next beat ---------- */
    async run() {
      this.audio.init();
      $("#black-curtain").style.opacity = "0";
      await this._runFrom(0, this.runToken);
    }

    /* FIX: _runFrom now takes a token snapshot. After every await
       (both the beat function itself and gate.wait()), it checks
       whether this.runToken still matches its own token. If a
       newer _jumpTo() call has bumped runToken in the meantime,
       this (now-stale) loop stops immediately instead of
       continuing to run in parallel with the new one. */
    async _runFrom(startIndex, token) {
      for (let i = startIndex; i < this.beats.length; i++) {
        if (token !== this.runToken) return; // a newer run superseded this one — abort
        this.beatIndex = i;
        this._updateHUD();
        this.busy = true;
        await this.beats[i].fn();
        this.busy = false;
        if (token !== this.runToken) return; // check again after the beat ran
        if (i < this.beats.length - 1) {
          await this.gate.wait();
          if (token !== this.runToken) return; // check again after waking up
        }
      }
    }

    /* ---------- utility: animated counter ---------- */
    async _countUp(selector, from, to, duration) {
      const el = $(selector);
      if (!el) return;
      const start = performance.now();
      return new Promise((resolve) => {
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1);
          const val = Math.floor(from + (to - from) * (1 - Math.pow(1 - p, 3)));
          el.textContent = val;
          if (p < 1) requestAnimationFrame(tick);
          else { el.textContent = to; resolve(); }
        };
        requestAnimationFrame(tick);
      });
    }
  }

  /* ============================================================
     BOOT
     ============================================================ */
  window.addEventListener("DOMContentLoaded", () => {
    const director = new StageDirector();
    setTimeout(() => director.run(), 250);
  });
})();
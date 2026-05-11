 The Hidden Gap
 Effort vs Opportunities in Data Analysis

**A Data-Driven Study of the Egyptian Job Market**

*Rawad Misr Digital Training Program — Team Gaplens*

---

**225 Students Surveyed** · **467 Jobs Analyzed** · **5 Analysis Phases** · **6 Key Findings**

 Table of Contents

- [Executive Summary](#-executive-summary)
- [The Problem](#-the-problem)
- [Research Questions](#-research-questions)
- [Datasets](#-datasets)
- [Methodology](#-methodology)
- [Key Findings](#-key-findings)
- [Key Performance Indicators](#-key-performance-indicators)
- [Technologies & Tools](#-technologies--tools)
- [Project Structure](#-project-structure)
- [Deliverables](#-deliverables)
- [Recommendations](#-recommendations)
- [Limitations & Future Work](#-limitations--future-work)
- [Team](#-team)
- [Setup & Execution](#-setup--execution)

---

 Executive Summary

This project investigates **why Data Analysis students and graduates in Egypt invest significant effort in skill development yet struggle to secure real opportunities**. Through primary survey data (225 respondents) and job market analysis (467 scraped job postings), we discovered that the gap is **not about lacking skills — it's about misdirected effort**.

Our statistically significant finding (r = −0.151, p = 0.041) reveals that **students who study more hours actually have lower acceptance rates** — a phenomenon explained by reverse causality: rejected students keep studying harder without changing direction, while accepted students stop and start working.

The study employs descriptive analysis, gap analysis, logistic regression, chi-square tests, and KMeans clustering to produce actionable, data-driven recommendations for students, universities, and training programs.

---

  The Problem

> **"Students are working hard — but in the wrong direction."**

Data Analysis is one of the fastest-growing fields in the Egyptian job market. Thousands of students invest in online courses, certifications, and projects. Yet many struggle to land their first opportunity.

We set out to find **where exactly the disconnect happens** — and the answer surprised us.

---

  Research Questions

**Core Question:**
*Why do Data Analysis students/graduates in Egypt invest significant learning effort but struggle to secure opportunities?*

**Sub-Questions:**
1. Is there a **skill gap**? (Students lack required skills)
2. Is there a **skill mismatch**? (Students learn the wrong skills)
3. Is there a **presentation gap**? (Students can't prove their skills)
4. Is there an **awareness gap**? (Students can't find opportunities)
5. Are there **systemic barriers**? (Geography, university type, networking)

---

  Datasets

  Dataset 1: Student Survey
| Attribute | Value |
|-----------|-------|
| **Source** | Google Forms survey |
| **Respondents** | 225 students & graduates |
| **Questions** | 24 (demographics, skills, effort, outcomes, perception) |
| **Features Engineered** | 62 columns after cleaning |
| **Collection Period** | March 2026 |

**Key columns:** `python_lvl`, `sql_lvl`, `excel_lvl`, `stats_lvl`, `learning_hours_num`, `apps_count_num`, `accept_count_num`, `has_mentor`, `has_portfolio_flag`, `projects_num`, `region_category`, `university_type`, `faculty_category`, `perceived_barriers`, `frustration_sources`

  Dataset 2: Job Market
| Attribute | Value |
|-----------|-------|
| **Source** | Web scraping (Wuzzuf, LinkedIn, Forasna) |
| **Total Jobs** | 467 Data Analyst positions |
| **Coverage** | Egypt + Gulf region |
| **Entry-Level Filter** | 0–3 years experience only |
| **Extraction Method** | n8n automation + Claude AI (95% accuracy) |

**Key columns:** `python_required`, `sql_required`, `excel_required`, `statistics_required`, `tableau_required`, `powerbi_required`, `ml_required`, `experience_years`, `remote_option`, `communication_mentioned`, `teamwork_mentioned`

---

  Methodology

  Phase 0: Data Preparation
- Survey response cleaning and standardization
- Skill levels converted to numeric scale (0–4)
- Binary flags created for all skills (`has_python`, `has_sql`, etc.)
- Geographic categorization (Cairo/Alex vs Provinces)
- Faculty and major classification
- n8n + Claude AI automated extraction of skills from 467 job descriptions
- Entry-level filtering (0–3 years) to ensure fair comparison

  Phase 1: Descriptive Analysis
- Student skill distribution (supply side)
- Job market skill requirements (demand side)
- Demographic segmentation (geography, university, faculty, academic stage)

  Phase 2: Gap Analysis (Core)
- Skill-by-skill comparison: Student Supply % vs Market Demand %
- Gap Score = Demand % − Supply %
- Classification: Critical (>30%) / Moderate (15–30%) / Minor (<15%) / Oversupplied (negative)

  Phase 3: Effort vs Results
- Pearson correlation: learning hours vs acceptance
- Logistic regression: multi-factor acceptance prediction
- Conversion funnel: Total → Skills → Applied → Accepted

  Phase 4: Statistical Testing
- Chi-square tests for categorical variables
- Logistic regression with Odds Ratios
- Cohen's h effect sizes
- Statistical power analysis
- Significance threshold: p < 0.05

  Phase 5: Segmentation
- KMeans clustering (K=4, 17 features)
- Persona profiling and auto-naming
- Success profile: Winners (2+ acceptances) vs Losers (0 acceptances)
- Perception vs Reality analysis (perceived barriers, frustration sources)

---

 Key Findings

 Finding 1: The Skill Mismatch
Students focus on "trendy" skills while neglecting foundational requirements.

| Skill | Market Demand | Student Supply | Gap |
|-------|:------------:|:--------------:|:---:|
| SQL | 62% | 34% | **−28% (Shortage)** |
| Power BI | 45% | 22% | **−23% (Shortage)** |
| Statistics | 61% | 42% | **−19% (Shortage)** |
| Python | 46% | 68% | +22% (Oversupplied) |
| ML | 39% | 61% | +22% (Oversupplied) |
| Excel | 43% | 90% | +47% (Oversupplied) |

 Finding 2: Effort ≠ Results (The Hidden Gap) 
**Statistically significant (p = 0.041):** More study hours correlate with **lower** acceptance rates.

| Hours/Week | Acceptance Rate |
|:----------:|:--------------:|
| < 2 hours | **61.5%** |
| 2–5 hours | 46.1% |
| 5–10 hours | 42.1% |
| 10+ hours | **30.8%** |

- Pearson r = −0.151, p = 0.041
- Logistic Regression: OR = 0.757 (each additional hour → 24% lower odds)
- **Explanation:** Reverse causality — rejected students keep studying harder without changing direction

 Finding 3: The Conversion Funnel
| Stage | Count | Rate | Drop |
|-------|:-----:|:----:|:----:|
| Total Students | 225 | 100% | — |
| Has Basic Skills | 214 | 95.1% | 4.9% |
| Applied to Jobs | 185 | 82.2% | 13.6% |
| Got Accepted | 83 | 36.9% | **55.1%** |

**Biggest loss occurs after application (55% drop)** — the problem is in screening/interviews, not in applying.

 Finding 4: What Actually Matters

| Factor | Impact | p-value | Verdict |
|--------|--------|:-------:|---------|
| Learning Hours | r = −0.151 | **0.041** ✅ | More hours = fewer acceptances |
| Mentor Contact | OR = 1.32 | 0.468 | Likely helps (underpowered) |
| University Type | — | 0.520 | **No effect** |
| Geography | — | 0.740 | **No effect** |
| Paid Training | OR = 0.70 | 0.296 | **Slightly hurts** |
| Portfolio | OR = 0.79 | 0.574 | **No effect** (selection bias) |

 Finding 5: The Perception Paradox
- Rejected students rate their market understanding **higher** (3.39/5) than accepted students (3.29/5)
- Rejected students rate their interview readiness **higher** (3.72/5) than accepted students (3.42/5)
- **Self-perception does not predict success**

 Finding 6: Student Personas (KMeans, K=4)
| Persona | Size | Key Trait | Acceptance |
|---------|:----:|-----------|:----------:|
| Power Users | 36 (16%) | 100% Kaggle, 94% Power BI | 36.1% |
| High Achievers | 100 (44%) | 80% Python, 95% Power BI | 39.0% |
| Beginners | 20 (9%) | 30% Python, 0% Excel | 35.0% |
| Excel-Only | 69 (31%) | 100% Excel, 11% Tableau | 34.8% |

**Acceptance rates are remarkably similar (34.8%–39.0%) across all personas.** Skill level alone does not determine success.

 Success Profile: Winners vs Losers
| Factor | Gap (Winners − Losers) |
|--------|:----------------------:|
| **Mentor Contact** | **+9.4%** ✅ (Only positive) |
| Related Major | −15.5% |
| Power BI | −14.1% |
| ML | −10.5% |
| Cairo | −8.0% |
| Portfolio | −5.2% |

**The only factor where winners clearly lead is Mentor access.**

---

 Key Performance Indicators

| KPI | Value |
|-----|:-----:|
| Total Survey Responses | 225 |
| Total Jobs Analyzed | 467 |
| Application Rate | 82.2% |
| Acceptance Rate (of applicants) | 44.9% |
| Biggest Skill Gap | SQL (−28%) |
| Most Oversupplied Skill | Excel (+47%) |
| Effort-Outcome Correlation | r = −0.151 (p = 0.041) |
| Mentor Effect (Odds Ratio) | 1.32× |
| Funnel Drop (Applied → Accepted) | 55.1% |
| KMeans Personas Identified | 4 |

---

 Technologies & Tools

| Function | Tool |
|----------|------|
| Data Collection | Google Forms |
| Data Cleaning & Analysis | Python (Pandas, NumPy, SciPy) |
| Statistical Testing | SciPy (Pearson, Chi-Square), Scikit-learn (Logistic Regression) |
| Machine Learning | Scikit-learn (KMeans Clustering, StandardScaler) |
| Job Data Extraction | n8n Automation + Claude AI API |
| Web Scraping | Playwright (Python) |
| Visualization | Matplotlib, Seaborn |
| Dashboard | Power BI / Excel |
| Presentation | Python-pptx |
| Version Control | Git, GitHub |


---

 Deliverables

| # | Deliverable | Format | Description |
|---|-------------|--------|-------------|
| 1 | Cleaned Student Dataset | `.xlsx` / `.csv` | 225 rows, 62 features |
| 2 | Cleaned Job Market Dataset | `.xlsx` / `.csv` | 467 jobs with extracted skills |
| 3 | Gap Analysis Results | `.csv` | Skill-by-skill gap table |
| 4 | Statistical Test Results | `.csv` | All p-values, ORs, effect sizes |
| 5 | Segment Profiles | `.csv` | 4 KMeans personas |
| 6 | Visualizations | `.png` (12 files) | All analysis charts |
| 7 | Excel Dashboard | `.xlsx` | 6-sheet interactive dashboard |
| 8 | PowerPoint Presentation | `.pptx` | 14 slides, competition-ready |
| 9 | Presentation Script | `.docx` | Arabic, slide-by-slide |
| 10 | Project Roadmap | `.pdf` | Complete methodology document |

---

## 💡 Recommendations

| # | Recommendation | Priority | Evidence |
|---|---------------|:--------:|----------|
| 1 | **Intensive SQL Bootcamp** (2–4 weeks) | 🔴 CRITICAL | 62% demand vs 34% supply (28% gap) |
| 2 | **Tableau & Power BI Workshops** | 🟠 HIGH | 45% demand vs 22% supply |
| 3 | **Guided Learning Paths** (replace random courses) | 🟠 HIGH | r = −0.151: undirected effort hurts |
| 4 | **Structured Mentorship Programs** | 🟠 HIGH | Only factor differentiating winners (+9.4%) |
| 5 | **Deprioritize ML for Entry-Level** | 🟡 MEDIUM | ML oversupplied by 22% |
| 6 | **Industry Capstone Projects** | 🟡 MEDIUM | 64% cite "lack of experience" as barrier |
| 7 | **Job Application Coaching** | 🟡 MEDIUM | Fix Skill Paradox (skilled students aim too high) |
| 8 | **Employer Feedback Advocacy** | ⚪ LOW | 31% frustrated by zero response |

---

 Limitations & Future Work

 Limitations
- Sample size (225) limits statistical power for small effects
- Mentor effect (OR = 1.32) requires 500+ respondents for confirmation
- Self-reported skills may differ from actual proficiency
- Job market data is a time-bound snapshot

 Future Enhancements
- Expand survey to 500+ students across more universities
- Add employer interviews and hiring manager perspectives
- Longitudinal tracking of student outcomes over 1–2 years
- Deeper segmentation by field of study and graduation year
- Automated skill gap report generator for individual students

---

 Team

**Team Gaplens** — Rawad Misr Digital Training Program

| Role | Name | Contact |
|------|------|---------|
| Project Lead & Data Analyst | Rawan Ahmed | [LinkedIn](https://www.linkedin.com/in/rawan-ahmed-038574264/) · rawanahmed.ashraf@gmail.com |
| BI Developer | Abeer Adel | [LinkedIn](https://www.linkedin.com/in/abeer-adel-07a71b327) · abeeradel872@gmail.com |
| Data Engineer & Automation | Abdelrahman Osama | [LinkedIn](http://linkedin.com/in/abdelrahman-osama-662a9124b) · abdelrahmanabdelwahid03@gmail.com |
| Data Curator | Ahmed Fawzy | [LinkedIn](https://www.linkedin.com/in/ahmed-fawzy-587215361) · sharweedahmed330@gmail.com |


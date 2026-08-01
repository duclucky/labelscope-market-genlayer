# LabelScope Market — ideation and selection record

Checked: 2026-08-01

## Current landscape

GenLayer is useful when neutral validators must interpret independently checkable evidence and the accepted decision changes shared state or value. The current public examples and ecosystem remain crowded around generic arbitration, agent-deliverable escrow, fact/sentiment oracles, prediction resolution, DAO policy, and deployment tooling.

The current GenHub projects page showed five projects: Synquesta, Shipyard, GenRebalancer, GenLayer Dev Toolkit, and On-Chain Sentiment Oracle. The local collision set additionally excludes generic web compliance, fact checking, milestone review, clause interpretation, escrow release, reputation scoring, governance mandate enforcement, software-interface quarantine, product-recall quarantine, agent-access policy enforcement, generic agent-deliverable escrow, and SEC filing-trigger settlement.

The gap selected for this project is a specialized, typed resolution primitive for the semantic scope of an official regulatory decision. It uses a fully collateralized two-sided pool rather than the recurring bond/challenge/quarantine architecture.

## Authoritative sources

| Source | What it establishes | Limit |
| --- | --- | --- |
| [When to Use GenLayer](https://docs.genlayer.com/developers/intelligent-contracts/when-to-use-genlayer) | Judgment, independently checkable evidence, neutral consensus, structured output, and direct consequence are required. | Product guidance, not project evidence. |
| [Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle) | Validators should independently verify stable decision fields instead of accepting output shape or prose. | Runtime/API choice must still be proven against the selected runner family. |
| [Current SDK API](https://sdk.genlayer.com/main/_static/ai/api.txt) | Current public GenVM interfaces. | Must be paired with the exact Depends runner and a network smoke test. |
| [Official project boilerplate](https://github.com/genlayerlabs/genlayer-project-boilerplate) | Current project/runtime scaffolding and Depends hash. | Football/sample product files are not reusable project content. |
| [About Drugs@FDA](https://www.fda.gov/drugs/drug-approvals-and-databases/about-drugsfda) | Drugs@FDA is the FDA catalog of approved products, labels, approval letters, and reviews, updated daily. | A source outage or missing document is not a negative verdict. |
| [openFDA drug-label API](https://open.fda.gov/apis/drug/label/how-to-use-the-endpoint/) | Public machine-readable label endpoint and query bounds. | Data remains subject to FDA/openFDA disclaimers and update behavior. |
| [FDALabel](https://www.fda.gov/science-research/bioinformatics-tools/fdalabel-full-text-search-drug-product-labeling) | Approved labeling exposes indication, warning, dosage, and related sections with persistent identifiers. | The market resolves label meaning only; it gives no medical advice. |

Tool snapshot on 2026-08-01: `genlayer 0.39.2`, `genlayer-js 1.1.8`, `genlayer-test 0.29.2`, and `genvm-linter 0.11.0`. The official boilerplate still pins `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`. These are research observations, not a dependency lock; Stage 2 must prove one compatible API family before production source changes.

## Problem-first discovery

| # | Adversarial situation | Decision that must not belong to one party | Evidence feasibility | Screen result |
| --- | --- | --- | --- | --- |
| 1 | YES and NO forecasters fund opposite views about the exact patient scope of an upcoming FDA action. | Whether the official label satisfies every locked indication facet. | FDA approval notice plus Drugs@FDA/openFDA; public, bounded, exact identifiers. | SURVIVE |
| 2 | A DeSci sponsor and milestone financier disagree whether a registered clinical trial met its primary endpoint. | Whether posted results correspond to the pre-registered endpoint and meet the locked success rule. | ClinicalTrials.gov API is public, but sponsor-reported results and milestone structure collide with legacy milestone review. | SURVIVE TO CANDIDATE, THEN REJECT |
| 3 | An inactive maintainer and nominated stewards dispute emergency transfer of scoped protocol-admin rights. | Whether public repository responses meaningfully mitigate a known exploited vulnerability before a deadline. | Official repository plus CISA KEV are public; response meaning is judgeable, but the software-evidence and governance-right collision is high. | SURVIVE TO CANDIDATE, THEN REJECT |
| 4 | Autonomous game agents accept a natural-language treaty and later dispute whether a turn broke it. | Whether the canonical signed match action breaches an accepted clause. | Canonical transcript is bounded, but no independent external authority exists and the structure overlaps mandate/action enforcement. | REJECT |
| 5 | A facility sponsor and community reserve disagree whether an EPA settlement satisfies a remediation release condition. | Whether the official enforcement action contains the locked remedy and scope. | EPA ECHO is authoritative, but the tested web-service definition failed to load and source reliability is insufficient for this cycle. | REJECT |
| 6 | Competing vendors dispute whether a public procurement award honored qualitative tender conditions. | Whether the official award rationale satisfies locked tender clauses. | SAM.gov data access and document coverage are not consistently credential-free and bounded. | REJECT |
| 7 | Airline and passenger pool participants disagree whether a disruption qualifies for compensation. | Whether the cause fits an extraordinary-circumstance rule. | Public timing data exists, but authoritative cause evidence is incomplete or private. | REJECT |
| 8 | Market participants bet on whether a WHO declaration covers a specified geography and pathogen. | Whether the declaration language matches the locked event. | WHO statements are public, but the architecture is a generic binary event resolver with weak differentiation. | REJECT |
| 9 | Agent buyer and provider dispute a signed A2A task trace. | Which agent materially failed the protocol. | Actor-controlled receipts need complex attestation and collide with existing agent escrow/fault-router work. | REJECT |
| 10 | A protocol treasury disputes whether a CISA vulnerability applies to its deployed dependency. | Whether product/version/context fall inside the advisory scope. | CISA and vendor advisories are public, but applicability plus quarantine repeats the recall/interface-covenant shape. | REJECT |

## Architecture candidates

### 1. LabelScope Market — selected

A fully collateralized binary pool locks a typed FDA label-scope question before staking closes. After the resolution time, validators fetch the exact official sources and classify each required facet. `MATCH` settles the pool to YES positions, `NO_MATCH` settles it to NO positions, and `UNVERIFIABLE` creates no settlement and remains retryable or refundable after the recovery window.

Exceptional dimension: **authoritative evidence quality**. Drugs@FDA and openFDA provide exact application, label set, and effective-date anchors while the full indication wording still needs semantic judgment.

Concrete downstream consumers:

1. a VitaDAO-style research treasury that uses label-scope forecasts when planning follow-on funding;
2. a Metaculus-style biotech forecasting league that wants neutral pooled settlement;
3. a milestone-finance vault that conditions a diligence budget on a narrowly defined regulatory indication.

These are integration archetypes, not adoption claims.

### 2. TrialEndpoint Tranche — rejected

ClinicalTrials.gov offers a strong structured source, but the architecture still evaluates whether a pre-agreed milestone was met and releases a tranche. That collides with the excluded qualitative-milestone structure, and sponsor-reported results weaken the evidence boundary.

### 3. Maintainer Continuity Vault — rejected

Temporary transfer of scoped admin rights is distinctive, but the evidence combines actor-controlled repository behavior with vulnerability advisories. It also collides with registered software-evidence covenants and governance-right suspension. The evidence and differentiation gates are not clean enough.

### 4. Remediation Reserve — rejected

An EPA-action-conditioned reserve has a meaningful consequence, but the ECHO web-service probe was unreliable and the product would inherit legal/compliance interpretation risks. Evidence feasibility fails for this build cycle.

## Seven-part fingerprint

1. **Trust problem:** the market operator and either side of a funded forecast must not unilaterally interpret whether FDA approval language matches the locked indication scope.
2. **Actors/adversary:** YES position holders benefit from an expansive match; NO position holders benefit from a narrow interpretation; the creator can bias the initial question but cannot change it after the first stake.
3. **Evidence class:** exact FDA approval notice, Drugs@FDA application documents, and openFDA label record, bounded to locked FDA hosts, identifiers, effective date, response size, and fetch count.
4. **Consensus question:** whether all required indication facets—condition, biomarker, population, disease stage, prior-therapy context, combination requirement, and approval class—are present in the official label, producing `MATCH`, `NO_MATCH`, or `UNVERIFIABLE`.
5. **State machine:** `DRAFT -> OPEN -> LOCKED -> RESOLUTION_PENDING -> RESOLVED_YES | RESOLVED_NO`, with `RETRYABLE` and `CANCELLED_REFUND` recovery paths; stakes and claims are isolated per market and participant.
6. **Direct consequence:** a finalized semantic verdict deterministically selects the winning side and opens pro-rata withdrawal credit from the fully collateralized pool; unverifiable evidence never pays either side.
7. **Reuse surface:** research treasuries, forecast tournaments, and milestone-finance products can create typed markets, fund positions, request resolution, claim credit, and read canonical market/position views without copying FDA interpretation logic.

## Mandatory gate matrix

| Gate | Result | Evidence/reason |
| --- | --- | --- |
| Replacement | PASS | A database or operator LLM could display a label, but participants would still trust one party's semantic interpretation before pooled value moves. |
| Judgment | PASS | Validators must independently map natural-language label wording to every locked indication facet; the client never submits a verdict. |
| Evidence | PASS | Exact FDA sources are public and bounded by application/set identifiers, host/path, effective date, response size, and fetch count. The live probe succeeded. |
| Equivalence | PASS | Consensus locks market/source identity, coverage, per-facet match booleans, overall verdict, and consequence class; rationale prose may vary. |
| Consequence | PASS | Finalized `MATCH` or `NO_MATCH` selects the side entitled to withdraw the collateral pool. |
| Adversarial | PASS | YES and NO holders have directly opposed financial incentives. |
| State model | PASS | Per-market/per-position keys, immutable terms after first stake, append-only attempts, claim accounting, and duplicate settlement/withdrawal prevention are required. |
| Reuse | PASS | Three concrete integration archetypes can use the typed writes and canonical views. |
| Contract count | PASS | One contract can own market terms, evidence policy, positions, consensus result, and payout credits; a pass-through consumer would add no trust boundary. |
| Differentiation | PASS | The pooled position/market lifecycle differs from covenant claims, quarantine, access suspension, recall remedies, and bilateral escrow on at least five fingerprint dimensions. |
| Claim-to-code | PASS — planned | The Stage 1 capability and UI-action matrices map create, stake, lock, resolve, retry/cancel, claim, and canonical reads; Phase 4 must finalize method names/tests/evidence before code. |
| Full lifecycle | PASS — feasible | The Projects path covers creator setup, two opposed browser wallets, funded positions, live FDA adjudication, finalized side selection, canonical reload, and winner withdrawal. |
| Scope honesty | PASS | Only research, source probes, and product design are complete. Contract, tests, Studionet, browser writes, adoption, and legal/regulatory review remain unproven. |

## Viability spike

The bounded probe fetched the official FDA notice for zidesamtinib/Jideytro with HTTP 200 and extracted the decision sentence: adults; locally advanced or metastatic; ROS1-positive NSCLC; at least one prior ROS1 TKI. A second live probe queried the matching Jideytro openFDA label and returned application `NDA220185`, set ID `3760e421-b523-4d9b-e063-6394a90ab94b`, effective time `20260722`, and the same indication scope.

Two independently phrased classification passes over the Jideytro excerpt produced the same critical result for the locked target `adult + locally advanced/metastatic + ROS1-positive NSCLC + prior ROS1 TKI`: all four facets present, `MATCH`, consequence `WIN_YES`. Replacing the prior-therapy facet with `TKI-naive` produced `NO_MATCH`, consequence `WIN_NO`. Free-text reasons differed but the critical fields stayed stable.

This proves source accessibility and semantic separability, not GenVM/Studionet behavior. Runtime web rendering, live model schema stability, consensus, and value transfer remain Stage 2 evidence.

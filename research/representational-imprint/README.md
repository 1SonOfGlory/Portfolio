# The Representational Imprint

**What returns after a language-model correction?**

Jabess Omane · independent research in progress · development evidence reviewed 7 October 2026.

This is a behavioral evaluation project, not a demonstrated mechanism of internal representation retention. The working title names the research program; it does not establish that an internal “imprint” exists. No peer-reviewed publication or established novelty is claimed.

## Plain-language question

A model may become less likely to associate particular jobs with “he” or “she” after corrective training. Is the original pattern actually different, or merely weaker? When training continues, does that pattern strengthen again, does general pronoun preference shift, or do both happen?

The intended contribution is a measurement and comparison protocol: separate these changes and compare a corrected model with an uncorrected model receiving the **same** further training. We are not proposing a new debiasing algorithm.

## Evidence so far

Two development correction runs have completed on `EleutherAI/pythia-410m`. Continued-training recovery has **not** been measured in these results.

| Measurement | Seed 2026 | Seed 2027 |
|---|---:|---:|
| Reduction in centered occupation-score spread | 57.267% | 59.897% |
| Original-pattern projection coefficient (baseline = 1) | 0.4272 | 0.4001 |
| Occupation rank correlation with baseline | 0.9588 | 0.9588 |
| General-text perplexity before | 29.6916 | 29.6916 |
| General-text perplexity after | 29.7580 | 29.7958 |
| Perplexity increase | 0.2238% | 0.3511% |
| Explicit-pronoun controls correct | 20 → 19 of 20 | 20 → 19 of 20 |

The occupation pattern became weaker but retained a similar ordering. A prompt explicitly specifying “he/him” incorrectly favored “she” after correction in both runs. These findings do not establish an unqualified fairness improvement or preserved general capability.

Perplexity uses 128 fixed general-text paragraphs, comprising 14,858 predicted tokens. Two training seeds do not provide independent datasets or model-family replication. The development occupations were examined previously; they are not an untouched confirmation set.

Machine-readable chart values and provenance are in [portfolio-evidence.json](portfolio-evidence.json). Its `archiveSha256` identifies the reviewed measurement archive. This repository includes selected derived evidence, not the full original measurement archive or multi-gigabyte model checkpoints. Chart points average within-template-centered scores over eight templates; metric values follow the full evaluation matrices. No confirmation items are distributed here.

## Measurement decomposition

For occupation `o`, template `t` and checkpoint `k`, define:

```text
s[k,o,t] = log P(he | prompt[o,t]) − log P(she | prompt[o,t])
m[k,t]   = mean_o s[k,o,t]
r[k,o,t] = s[k,o,t] − m[k,t]
a[k]     = <r[k], r[base]> / <r[base], r[base]>
e[k]     = r[k] − a[k] r[base]
```

- `m` measures mean preference on these prompts, not a universal pronoun prior.
- `r` is the occupation-specific profile after removing the template mean.
- `a` measures strength along the original profile: baseline 1, no component in that direction 0. It is not an estimate of internal memory.
- The residual `e` captures departures from simple rescaling. Report its RMS alongside profile RMS, cosine similarity and occupation rank correlation.

A uniform offset changes mean preference without changing the centered profile. A uniform rescaling can preserve perfect correlation while almost eliminating profile magnitude. Therefore correlation alone cannot establish that an association has “returned.” Zero-length profiles have undefined direction, not perfect agreement. The included metric tests exercise these distinctions.

## Correction and evaluation

- **Model revision:** `9879c9b5f8bea9051dcb0e68dff21493d67e9d4f`.
- **Training prompts:** 24 occupations × 4 templates = 96 prefixes.
- **Target:** freeze the original next-token distribution `q`; set `q_he = q_she = (q_he_original + q_she_original)/2`, leaving other token probabilities unchanged. Minimize `KL(q || p)`.
- **Optimization:** full-weight FP32 AdamW, learning rate `1e-6`, weight decay 0, batch size 8, 2 epochs / 24 updates, gradient clipping 1.0. Preserve eval-mode training with gradients enabled, which disables dropout.
- **Development evaluation:** 16 occupations × 8 templates, plus neutral controls, explicit-pronoun controls, ordinary-text margins and the fixed language-performance check.
- **Reconstruction caveat:** the original executed E03 notebook is unavailable. This is a documented reconstruction from available artifacts, not a claim of bitwise reproduction. Environment and discrepancy checks are recorded by the runtime.

## Reproduce and inspect

1. Download [E04_Colab_Kaggle.ipynb](E04_Colab_Kaggle.ipynb) and [pilot_inputs.zip](pilot_inputs.zip). Open the notebook in Colab with a GPU runtime. Upload the ZIP using the Files panel to `/content/pilot_inputs.zip` before running the unpack cell. On Kaggle, attach it as notebook input.
2. Run notebook sections **1–6** for a correction reconstruction and export. Read the comparison and controls before proceeding. The input package includes checksums; the notebook verifies them.
3. Repeat correction with seeds 2027 and 2028. Record environment, discrepancies, time and resource usage. A successful run is not guaranteed by free GPU availability.
4. Continued training is deliberately gated. Read [PILOT_PROTOCOL.txt](PILOT_PROTOCOL.txt) and review the reconstruction before enabling later sections. The shipped protocol is an exploratory development plan, not a preregistration.

For CPU-only metric checks, install NumPy and run from this directory:

```bash
python -m unittest test_pilot_metrics.py
```

The notebook pins research dependencies and keeps the platform GPU PyTorch; the runtime records versions. `pilot_runtime.py` is also inside the ZIP so the notebook can run independently. They must remain byte-identical when updating a release, with package checksums refreshed. Do not edit the measurement code to make results match the table.

## Next experiment, conditional on checks

Three paired seeds, two conditions: reconstructed correction versus original model. Give each pair the same shuffled, filtered WikiText **training** blocks with fresh optimizers. Use 300 updates, effective batch 8, sequence length 128, FP32, learning rate `1e-6`; measure at 0, 1, 5, 10, 25, 50, 100, 200 and 300 updates. Checkpoints are repeated observations within a trajectory, not independent replicates.

The planned corpus has 2,400 unique blocks and filters development occupation aliases and exact evaluation-paragraph overlap. Filtering does not establish social neutrality or exclude pretraining overlap. Compare paired trajectories of mean preference, original-pattern strength, residual change, ordinary-text margins, controls and perplexity. Do not interpret a rise in one score as proof of internal retention.

Before confirmation, freeze the analysis, uncertainty procedure, equivalence margins and stopping criteria. Keep reserved confirmation occupations/templates sealed. Broaden to another model family only if measurement validity, resource feasibility and the contribution justify it.

## Resources, limits and contribution threshold

Free Colab/Kaggle compute supports the initial pilot; runtime and memory feasibility must be measured before scaling. Full-model resume states consume several GB, and the notebook requires at least 14 GiB free storage to start. Session interruptions and GPU availability constrain execution. Grant or academic compute would support broader replication, not substitute for a sound research question.

The probes cover binary pronoun associations in controlled English prompts. They do not measure gender inclusivity comprehensively, real-world discrimination, hiring suitability or all aspects of model fairness. The control regression must remain visible. A useful result must show that decomposition changes the interpretation relative to aggregate evaluation, rather than merely adding more plots.

## Relationship to existing work

Bias reduction, superficial debiasing and relearning are established topics. Novelty requires a narrower literature comparison; it is not established by these pilot results.

- [Orgad et al., *How Gender Debiasing Affects Internal Model Representations, and Why It Matters*](https://arxiv.org/abs/2204.06827): relevant to the distinction between output changes and internal evidence. Our behavioral pilot does not reproduce a mechanistic claim.
- [*Fine-Tuning is Subgraph Search*, version 3](https://arxiv.org/html/2502.06106v3): a close measurement overlap requiring explicit comparison, including its gender-bias evaluations.
- [*ProSocialTuning*](https://aclanthology.org/2024.findings-acl.109/): prior work relevant to bias relearning through subsequent fine-tuning.
- [*Chained Tuning Leads to Biased Forgetting*](https://arxiv.org/abs/2412.16469): relevant to differences between group-specific and overall changes during sequential tuning.

## Repository map

| File | Purpose |
|---|---|
| `pilot_runtime.py` | Training, evaluation, checkpointing and export |
| `test_pilot_metrics.py` | Tests of decomposition behavior |
| `E04_Colab_Kaggle.ipynb` | Guided GPU workflow with review gates |
| `pilot_inputs.zip` | Checksum-protected development inputs and matching runtime |
| `PILOT_PROTOCOL.txt` | Detailed development experiment plan |
| `portfolio-evidence.json` | Audited, selected pilot results used by the website |

Research design, implementation and analysis: Jabess Omane, with AI-assisted development and review. Independent validation, methodological critique and collaboration are welcome.

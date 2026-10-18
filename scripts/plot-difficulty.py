"""Plot examples/mine_run.json (written by scripts/measure-difficulty.js)
into examples/difficulty_adjustment.png.

Usage: python scripts/plot-difficulty.py
Requires: pip install matplotlib
"""

import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
EXAMPLES = os.path.join(HERE, "..", "examples")
MINE_RATE_MS = 3000  # keep in sync with config.js MINE_RATE

with open(os.path.join(EXAMPLES, "mine_run.json")) as f:
    rows = json.load(f)

idx = [r["index"] for r in rows]
difficulty = [r["difficulty"] for r in rows]
mine_ms = [r["mineTimeMs"] for r in rows]

fig, ax1 = plt.subplots(figsize=(9, 5))

ax1.set_xlabel("Block #")
ax1.set_ylabel("Difficulty", color="tab:blue")
ax1.plot(idx, difficulty, color="tab:blue", marker="o", markersize=3, linewidth=1.5, label="Difficulty")
ax1.tick_params(axis="y", labelcolor="tab:blue")

ax2 = ax1.twinx()
ax2.set_ylabel("Mine time (ms)", color="tab:orange")
ax2.plot(idx, mine_ms, color="tab:orange", marker="s", markersize=3, linewidth=1.5, label="Mine time")
ax2.axhline(MINE_RATE_MS, color="gray", linestyle="--", linewidth=1, label=f"MINE_RATE target ({MINE_RATE_MS}ms)")
ax2.tick_params(axis="y", labelcolor="tab:orange")

lines1, labels1 = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines1 + lines2, labels1 + labels2, loc="upper left")

plt.title("Real mining run: difficulty adjusting itself toward a 3s block time")
fig.tight_layout()

out_path = os.path.join(EXAMPLES, "difficulty_adjustment.png")
plt.savefig(out_path, dpi=130)
print(f"Wrote {out_path}")

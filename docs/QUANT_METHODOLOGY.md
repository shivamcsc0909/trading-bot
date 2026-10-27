# 📐 Quantitative Methodology & Anti-Overfitting Framework
### Institutional Standards for Algorithmic Strategy Validation & Risk Preservation

---

## 1. The Core Quantitative Objective Function

Rather than optimizing for raw profit (which leads to severe overfitting and parameter fragility), the system optimizes for **Risk-Adjusted Expectancy ($E$) and Tail-Risk Minimization**:

$$E = (P_{\text{win}} \times W) - (P_{\text{loss}} \times L) - C_{\text{friction}}$$

Where:
* $P_{\text{win}}$: Empirical Out-of-Sample Win Rate
* $W$: Average Winning R-Multiple (Normalized Reward)
* $P_{\text{loss}}$: Empirical Out-of-Sample Loss Rate ($1 - P_{\text{win}}$)
* $L$: Average Losing R-Multiple (Normalized Risk = $1.0$)
* $C_{\text{friction}}$: Cumulative Slippage + Spread + Broker Commission

---

## 2. Walk-Forward Cross-Validation (TimeSeriesSplit)

Standard K-Fold Cross-Validation leaks future information into past predictions (Temporal Lookahead Bias). We strictly enforce **Expanding and Rolling Walk-Forward Windows**:

```
[ Train: Fold 1 (t0 - t100) ] ---> [ Test: Out-of-Sample (t101 - t125) ]
[ Train: Fold 2 (t0 - t125) ] ---------> [ Test: Out-of-Sample (t126 - t150) ]
[ Train: Fold 3 (t0 - t150) ] --------------> [ Test: Out-of-Sample (t151 - t175) ]
```

### Validation Gates:
1. **Brier Score Calibration**: Forecasted probabilities ($P_{\text{bull}}$) must achieve a Brier Score $\le 0.22$.
2. **Stability Index**: $\sigma(\text{Accuracy}_{\text{folds}}) \le 0.08$. If performance fluctuates wildly between folds, the parameter set is rejected.

---

## 3. Monte Carlo Trade-Order Shuffling (Robustness Stress Testing)

To verify that strategy profitability is not an artifact of favorable trade sequences:
1. **10,000 Shuffled Simulations**: Trade order sequence is randomly permuted without replacement.
2. **Max Drawdown Floor at 99% Confidence**:
   $$\text{Max Drawdown}_{\text{99\%}} \le 8.5\%$$
3. **Probability of Ruin**: Calculated across 500 consecutive trades with a $0.5\%$ risk per trade; must remain **$< 0.01\%$**.

---

## 4. Friction & Slippage Modeling Table

| Instrument | Base Spread | Assumed Execution Slippage | Commission / Side | Effective Friction Per Roundtrip |
| :--- | :--- | :--- | :--- | :--- |
| **XAUUSD (Gold)** | 1.8 – 2.5 pts | 0.8 pts (Session Open) | \$0.04 / 0.01 Lot | **3.5 pts / trade** |
| **EURUSD** | 0.2 – 0.6 pips | 0.2 pips | \$0.03 / 0.01 Lot | **0.8 pips / trade** |
| **GBPUSD** | 0.5 – 1.1 pips | 0.4 pips | \$0.03 / 0.01 Lot | **1.5 pips / trade** |

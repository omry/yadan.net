const clamp=value=>Math.max(0,Math.min(1,value));
// Adaptive fitting has no known finish time or global optimum. Its share is
// estimated from loss reduction; bounded annealing uses actual completed trials.
// Only a settled solver may report 100%.
export function estimateOptimizationProgress(metrics,initialStress,annealingExpected,trialFraction=0){
 if(metrics.stable)return 100;
 const search=metrics.annealing;
 if(search){
  if(search.finished)return 99;
  return 20+75*clamp((search.attempt+clamp(trialFraction))/search.trials);
 }
 const reduction=initialStress>0?clamp(1-metrics.stress/initialStress):0;
 return (annealingExpected?20:99.9)*reduction;
}

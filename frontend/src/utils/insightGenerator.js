/**
 * Generates human-readable insights from the provided dataset.
 * 
 * @param {Array} data - The array of data objects.
 * @param {string} xKey - The key for the X-axis (category/time).
 * @param {string} yKey - The key for the Y-axis (metric).
 * @returns {Array} - An array of insight objects { text, type, value, status }.
 */
export const generateInsights = (data, xKey, yKey) => {
  if (!data || data.length === 0 || !xKey || !yKey) return [];

  const insights = [];
  
  // Extract numeric values for analysis
  const numericValues = data
    .map(row => ({ x: row[xKey], y: Number(row[yKey]) }))
    .filter(item => !isNaN(item.y));

  if (numericValues.length === 0) return [];

  // 1. Extreme Values (Max & Min)
  const maxItem = numericValues.reduce((prev, curr) => (curr.y > prev.y ? curr : prev), numericValues[0]);
  const minItem = numericValues.reduce((prev, curr) => (curr.y < prev.y ? curr : prev), numericValues[0]);

  insights.push({
    text: `The highest ${yKey} was recorded in ${maxItem.x} at ${maxItem.y.toLocaleString()}.`,
    type: 'extreme',
    value: maxItem.y,
    status: 'neutral',
    icon: 'target'
  });

  if (maxItem !== minItem) {
    insights.push({
      text: `The lowest ${yKey} was observed in ${minItem.x} (${minItem.y.toLocaleString()}).`,
      type: 'extreme',
      value: minItem.y,
      status: 'neutral',
      icon: 'arrow-down'
    });
  }

  // 2. Average calculation
  const sum = numericValues.reduce((acc, curr) => acc + curr.y, 0);
  const avg = Number((sum / numericValues.length).toFixed(2));
  
  insights.push({
    text: `Across all categories, the average ${yKey} is ${avg.toLocaleString()}.`,
    type: 'metric',
    value: avg,
    status: 'neutral',
    icon: 'calculator'
  });

  // 3. Trends and Percentage Change (if more than 1 point)
  if (numericValues.length > 1) {
    const first = numericValues[0].y;
    const last = numericValues[numericValues.length - 1].y;
    
    if (first !== 0) {
      const percentChange = Number(((last - first) / Math.abs(first) * 100).toFixed(2));
      const direction = percentChange >= 0 ? 'increased' : 'decreased';
      const status = percentChange >= 0 ? 'positive' : 'negative';
      
      insights.push({
        text: `${yKey} ${direction} by ${Math.abs(percentChange)}% overall from ${numericValues[0].x} to ${numericValues[numericValues.length - 1].x}.`,
        type: 'trend',
        value: percentChange,
        status: status,
        icon: percentChange >= 0 ? 'trending-up' : 'trending-down'
      });
    }
  }

  // 4. Distribution Insight (Optional)
  const threshold = avg * 1.5;
  const highPerformers = numericValues.filter(v => v.y > threshold);
  if (highPerformers.length > 0 && highPerformers.length < numericValues.length / 2) {
    insights.push({
      text: `${highPerformers.length} categories are performing significantly above average (>${threshold.toLocaleString()}).`,
      type: 'distribution',
      value: highPerformers.length,
      status: 'positive',
      icon: 'award'
    });
  }

  return insights;
};

export const filterData = (data, column, operator, value) => {
  if (!data || !column || !operator) return data;
  if (value === undefined || value === null || String(value).trim() === '') {
    return data; // Ignore filter if no value provided
  }
  
  return data.filter(row => {
    let rawRowVal = row[column];
    let rowVal = rawRowVal !== undefined && rawRowVal !== null ? String(rawRowVal).trim() : '';
    let compareVal = String(value).trim();

    // Handle contains
    if (operator === 'contains') {
      return rowVal.toLowerCase().includes(compareVal.toLowerCase());
    }

    // Try numeric parsing for other operators
    const numRowVal = Number(rowVal);
    const numCompareVal = Number(compareVal);
    const isNumeric = !isNaN(numRowVal) && !isNaN(numCompareVal) && compareVal !== '';

    if (isNumeric) {
      rowVal = numRowVal;
      compareVal = numCompareVal;
    } else {
      // Fallback to string comparison for exact match or general inequalities
      rowVal = rowVal.toLowerCase();
      compareVal = compareVal.toLowerCase();
    }

    switch (operator) {
      case '=': return rowVal === compareVal;
      case '>': return rowVal > compareVal;
      case '<': return rowVal < compareVal;
      case '>=': return rowVal >= compareVal;
      case '<=': return rowVal <= compareVal;
      default: return true;
    }
  });
};

export const groupData = (data, column) => {
  if (!data || !column) return {};
  
  return data.reduce((acc, row) => {
    const key = row[column] === undefined || row[column] === null ? 'Unknown' : String(row[column]);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(row);
    return acc;
  }, {});
};

export const calculateMetrics = (data, column, type) => {
  if (!data || !column || !type || data.length === 0) return null;

  let numericValues = [];
  
  // Extract and validate numeric values
  for (const row of data) {
    const val = Number(row[column]);
    if (!isNaN(val) && row[column] !== null && row[column] !== undefined && String(row[column]).trim() !== '') {
      numericValues.push(val);
    }
  }

  // Allow count to return length regardless of numeric status 
  if (type === 'count') {
    return data.length;
  }

  if (numericValues.length === 0) {
    return 'Invalid (Non-numeric data)';
  }

  switch (type) {
    case 'sum': {
      const sum = numericValues.reduce((a, b) => a + b, 0);
      return Number(sum.toFixed(2)); // truncate floating errors
    }
    case 'average': {
      const avg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      return Number(avg.toFixed(2));
    }
    case 'min':
      return Math.min(...numericValues);
    case 'max':
      return Math.max(...numericValues);
    default:
      return null;
  }
};

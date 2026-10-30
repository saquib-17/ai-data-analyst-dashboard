const { getDatasetAsync } = require('../services/datasetRegistry');
const { initDuckDB } = require('../services/analyticalEngine');

function queryAsync(conn, sql) {
  return new Promise((resolve, reject) => {
    conn.all(sql, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function serializeValue(val) {
  if (typeof val === 'bigint') return Number(val);
  if (val instanceof Date) return val.toISOString();
  return val;
}

function serializeRow(row) {
  const clean = {};
  for (const k of Object.keys(row)) {
    clean[k] = serializeValue(row[k]);
  }
  return clean;
}

async function computeDatasetSummary(dataset) {
  if (!dataset) return null;
  const conn = initDuckDB();
  const tableName = dataset.tableName;
  const schema = dataset.schema || {};
  const schemaKeys = Object.keys(schema);

  // Identify column types
  const numCols = schemaKeys.filter(k => {
    const t = schema[k]?.type || schema[k];
    return t === 'number' || t === 'integer' || t === 'float';
  });
  const dateCols = schemaKeys.filter(k => {
    const t = schema[k]?.type || schema[k];
    return t === 'date' || /date|time|year|month|day/i.test(k);
  });
  const catCols = schemaKeys.filter(k => !numCols.includes(k) && !dateCols.includes(k));

  const primaryNum = numCols.find(c => /revenue|sales|totalspend|spend|budget|amount|price|total/i.test(c)) || numCols[0] || null;
  const secondaryNum = numCols.find(c => c !== primaryNum && /profit|conversions|purchases|impressions|clicks|quantity|orders|count/i.test(c)) || numCols.find(c => c !== primaryNum) || null;
  const primaryCat = catCols.find(c => /product|campaign|customer|name|title|category|item/i.test(c)) || catCols[0] || null;
  const secondaryCat = catCols.find(c => c !== primaryCat && /region|country|segment|channel|department|type|status/i.test(c)) || catCols.find(c => c !== primaryCat) || null;
  const dateCol = dateCols[0] || null;

  // 1. Total row count
  const countRes = await queryAsync(conn, `SELECT COUNT(*) as total FROM ${tableName}`);
  const totalRows = Number(countRes[0]?.total || 0);

  // 2. Primary metric aggregation
  let primaryStats = null;
  if (primaryNum) {
    const statsRes = await queryAsync(conn, `
      SELECT 
        SUM("${primaryNum}") as total, 
        AVG("${primaryNum}") as average, 
        MIN("${primaryNum}") as min_val, 
        MAX("${primaryNum}") as max_val 
      FROM ${tableName}
    `);
    const r = statsRes[0];
    const isCur = /revenue|sales|spend|budget|price|cost|profit|amount/i.test(primaryNum);
    primaryStats = {
      column: primaryNum,
      label: `Total ${primaryNum}`,
      total: Number(r?.total || 0),
      average: Number((r?.average || 0).toFixed(2)),
      min: Number(r?.min_val || 0),
      max: Number(r?.max_val || 0),
      isCurrency: isCur
    };
  }

  // 3. Secondary metric aggregation
  let secondaryStats = null;
  if (secondaryNum) {
    const secRes = await queryAsync(conn, `SELECT SUM("${secondaryNum}") as total FROM ${tableName}`);
    const isCur = /revenue|sales|spend|budget|price|cost|profit|amount/i.test(secondaryNum);
    secondaryStats = {
      column: secondaryNum,
      label: `Total ${secondaryNum}`,
      total: Number(secRes[0]?.total || 0),
      isCurrency: isCur
    };
  }

  // 4. Entity metric
  let entityCount = 0;
  if (primaryCat) {
    const entRes = await queryAsync(conn, `SELECT COUNT(DISTINCT "${primaryCat}") as unique_count FROM ${tableName}`);
    entityCount = Number(entRes[0]?.unique_count || 0);
  }

  // 5. Top 5 categories bar data
  let topCategories = [];
  if (primaryCat && primaryNum) {
    const topRes = await queryAsync(conn, `
      SELECT "${primaryCat}" as name, SUM("${primaryNum}") as value 
      FROM ${tableName} 
      GROUP BY "${primaryCat}" 
      ORDER BY value DESC 
      LIMIT 5
    `);
    topCategories = topRes.map(serializeRow);
  } else if (primaryCat) {
    const topRes = await queryAsync(conn, `
      SELECT "${primaryCat}" as name, COUNT(*) as value 
      FROM ${tableName} 
      GROUP BY "${primaryCat}" 
      ORDER BY value DESC 
      LIMIT 5
    `);
    topCategories = topRes.map(serializeRow);
  }

  // 6. Distribution donut data (secondaryCat or fallback)
  let distribution = [];
  const distCol = secondaryCat || (catCols.length > 1 ? catCols[1] : primaryCat);
  if (distCol && primaryNum) {
    const distRes = await queryAsync(conn, `
      SELECT "${distCol}" as name, SUM("${primaryNum}") as value 
      FROM ${tableName} 
      GROUP BY "${distCol}" 
      ORDER BY value DESC 
      LIMIT 5
    `);
    const distRows = distRes.map(serializeRow);
    const sumVal = distRows.reduce((a, b) => a + Number(b.value), 0) || 1;
    distribution = distRows.map(r => ({
      name: String(r.name),
      value: Number(r.value),
      percentage: Number(((Number(r.value) / sumVal) * 100).toFixed(1))
    }));
  }

  // 7. Trend data
  let trend = [];
  if (dateCol && primaryNum) {
    const trendRes = await queryAsync(conn, `
      SELECT "${dateCol}" as period, SUM("${primaryNum}") as metric1, ${secondaryNum ? `SUM("${secondaryNum}")` : 'COUNT(*)'} as metric2 
      FROM ${tableName} 
      GROUP BY "${dateCol}" 
      ORDER BY period ASC 
      LIMIT 12
    `);
    trend = trendRes.map(serializeRow);
  } else if (topCategories.length > 0) {
    trend = topCategories.map((c, i) => ({
      period: c.name,
      metric1: c.value,
      metric2: secondaryStats ? Math.round(secondaryStats.total / (topCategories.length || 1)) : (i + 1)
    }));
  }

  // 8. Dynamic genuine insights
  const insights = [];
  if (topCategories.length > 0 && primaryStats && primaryStats.total > 0) {
    const top = topCategories[0];
    const share = ((top.value / primaryStats.total) * 100).toFixed(1);
    insights.push({
      title: `${top.name} is the top contributor`,
      desc: `Represents ${share}% of total ${primaryNum} (${primaryStats.isCurrency ? '$' : ''}${top.value.toLocaleString()})`
    });
  }
  if (distribution.length > 0 && distCol) {
    const topDist = distribution[0];
    insights.push({
      title: `${topDist.name} leads in ${distCol}`,
      desc: `Accounts for ${topDist.percentage}% of distribution across groups`
    });
  }
  insights.push({
    title: `${totalRows.toLocaleString()} Verified Records`,
    desc: `Columnar schema profiled across ${schemaKeys.length} attributes in DuckDB`
  });
  if (primaryStats && primaryStats.average > 0) {
    insights.push({
      title: `Average ${primaryNum}: ${primaryStats.isCurrency ? '$' : ''}${primaryStats.average.toLocaleString()}`,
      desc: `Calculated with 100% deterministic DuckDB precision`
    });
  }

  return {
    datasetId: dataset.id,
    filename: dataset.filename,
    rowCount: totalRows,
    columnCount: schemaKeys.length,
    primaryMetric: primaryStats,
    secondaryMetric: secondaryStats,
    entityMetric: primaryCat ? { column: primaryCat, label: `Unique ${primaryCat}s`, count: entityCount } : null,
    topCategories,
    distribution,
    distributionColumn: distCol,
    trend,
    insights
  };
}

async function run() {
  const dsList = ['f41c8197-9960-4659-a3b3-f178ca094acc', 'c8a2e154-7f19-4a92-b883-d9229f6b4991', 'b91d4e08-3a21-4d76-92f7-640b3c69e552'];
  for (const id of dsList) {
    const ds = await getDatasetAsync(id);
    const summary = await computeDatasetSummary(ds);
    console.log('\n========================================');
    console.log('SUMMARY FOR:', ds.filename);
    console.log('Row count:', summary.rowCount, 'Primary Metric:', summary.primaryMetric);
    console.log('Top Categories:', summary.topCategories);
    console.log('Distribution:', summary.distribution);
    console.log('Insights:', summary.insights);
  }
}

run().catch(console.error);


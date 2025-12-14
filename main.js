const url = new URL(window.location.href);
const user = url.searchParams.get("user");
const month = url.searchParams.get("month");
const elements = url.searchParams.get("elements")?.split(",") || [];

const firebaseBase =
  "https://soilbitchina-default-rtdb.firebaseio.com/Users/" +
  user +
  "/Farm/Nodes";

let chart;

const colorMap = {
  moisture: "#1E88E5",
  ph: "#D81B60",
  temperature: "#F4511E",
  ec: "#6A1B9A",
  nitrogen: "#00897B",
  phosphorus: "#3949AB",
  potassium: "#7CB342",
  salinity: "#5D4037"
};

const verticalSeparation = 0.6;

async function getAllNodeData() {
  const res = await fetch(firebaseBase + ".json");
  return await res.json() || {};
}

async function processGraphData() {
  const nodes = await getAllNodeData();
  const monthData = {};

  for (let nodeName in nodes) {
    const node = nodes[nodeName];
    if (!node.Packets) continue;

    for (let t in node.Packets) {
      const p = node.Packets[t];
      if (!p.timestamp) continue;

      const d = new Date(p.timestamp);
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = d.getDate();

      if (m !== month) continue;

      if (!monthData[day]) monthData[day] = {};

      elements.forEach(el => {
        if (p[el] !== undefined) {
          if (!monthData[day][el]) monthData[day][el] = [];
          monthData[day][el].push(Number(p[el]));
        }
      });
    }
  }
  return monthData;
}

async function buildGraph() {
  const data = await processGraphData();
  const days = Object.keys(data).map(Number).sort((a,b)=>a-b);

  const datasets = elements.map((el, i) => {
    const offset = i * verticalSeparation;

    return {
      label: el,
      data: days.map(day => {
        const v = data[day]?.[el];
        if (!v || v.length === 0) return null;
        return (v.reduce((a,b)=>a+b,0) / v.length) + offset;
      }),
      borderColor: colorMap[el] || "#000",
      borderWidth: 2,
      tension: 0.25,
      spanGaps: true,
      pointRadius: 0
    };
  });

  const ctx = document.getElementById("myChart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: { labels: days, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,   // 🔴 REQUIRED
      layout: {
        padding: { top: 2, bottom: 2, left: 2, right: 2 }
      },
      scales: {
        x: {
          ticks: { maxTicksLimit: 10 }
        },
        y: {
          ticks: { display: false },
          grid: { display: false }
        }
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            boxWidth: 10,
            padding: 6,
            font: { size: 10 }
          }
        }
      }
    }
  });
}

buildGraph();


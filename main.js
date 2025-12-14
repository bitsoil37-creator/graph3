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

  for (let node in nodes) {
    if (!nodes[node].Packets) continue;

    for (let k in nodes[node].Packets) {
      const p = nodes[node].Packets[k];
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
      data: days.map(d => {
        const v = data[d]?.[el];
        if (!v) return null;
        return v.reduce((a,b)=>a+b,0)/v.length + offset;
      }),
      borderColor: colorMap[el] || "#000",
      fill: false,
      lineTension: 0.25,
      pointRadius: 0,
      spanGaps: true
    };
  });

  const ctx = document.getElementById("myChart").getContext("2d");
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: days,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      title: {
        display: true,
        text: "Soil Sensor Data (Daily Average)",
        fontSize: 12,
        padding: 4
      },

      legend: {
        display: true,
        position: "top",
        labels: {
          boxWidth: 10,
          fontSize: 10
        }
      },

      scales: {
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: "Day of the Month",
            fontSize: 10
          },
          ticks: {
            fontSize: 9,
            maxTicksLimit: 10
          }
        }],
        yAxes: [{
          scaleLabel: {
            display: true,
            labelString: "Sensor Value",
            fontSize: 10
          },
          ticks: {
            fontSize: 9
          }
        }]
      }
    }
  });
}

buildGraph();

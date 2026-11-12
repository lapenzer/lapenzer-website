import { useEffect, useRef } from "react";
export default function Chart({
  data,
  layout = {},
  height = 260,
}: {
  data: any[];
  layout?: any;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    let plot: any;
    import("plotly.js-basic-dist-min").then((module) => {
      if (!active || !ref.current) return;
      plot = module.default;
      plot.react(
        ref.current,
        data,
        {
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: {
            family: "Inter, system-ui, sans-serif",
            color: "#8b9bb3",
            size: 11,
          },
          margin: { l: 45, r: 20, t: 20, b: 40 },
          xaxis: { gridcolor: "#202c3f", zerolinecolor: "#2b3850" },
          yaxis: { gridcolor: "#202c3f", zerolinecolor: "#2b3850" },
          showlegend: false,
          ...layout,
        },
        {
          responsive: true,
          displaylogo: false,
          modeBarButtonsToRemove: ["lasso2d", "select2d"],
          toImageButtonOptions: { format: "svg", filename: "aisnl-chart" },
        },
      );
    });
    return () => {
      active = false;
      if (plot && ref.current) plot.purge(ref.current);
    };
  }, [data, layout]);
  return (
    <div
      ref={ref}
      style={{ height, width: "100%" }}
      aria-label="Interactive statistical chart"
    />
  );
}

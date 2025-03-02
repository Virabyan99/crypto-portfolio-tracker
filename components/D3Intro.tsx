"use client";

import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";

export default function D3Intro() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState([20, 40, 60]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current)
      .attr("width", 400)
      .attr("height", 200)
      .style("background", "#f0f0f0");

    // Bind new data
    const circles = svg.selectAll("circle").data(data);

    // Update existing elements
    circles.attr("r", (d) => d);

    // Enter new elements
    circles.enter()
      .append("circle")
      .attr("cx", (d, i) => (i + 1) * 100)
      .attr("cy", 100)
      .attr("r", (d) => d)
      .attr("fill", "blue");

    // Exit pattern (remove extra elements)
    circles.exit().remove();
  }, [data]);

  return (
    <div>
      <svg ref={svgRef}></svg>
      <button
        className="mt-4 p-2 bg-blue-500 text-white rounded"
        onClick={() => setData(data.map((d) => d + 10))}
      >
        Increase Size
      </button>
    </div>
  );
}

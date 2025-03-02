"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface CryptoChartProps {
  data: { time: number; price: number }[];
}

export default function CryptoChart({ data }: CryptoChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const width = 600;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 30, left: 50 };

    // Convert timestamps to Date objects
    const formattedData = data.map(d => ({
      time: new Date(d.time),
      price: d.price
    }));

    // Define Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(formattedData, d => d.time) as [Date, Date])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([d3.min(formattedData, d => d.price) as number, d3.max(formattedData, d => d.price) as number])
      .range([height - margin.bottom, margin.top]); // SVG's Y-axis is inverted

    // Generate Line Path
    const lineGenerator = d3.line<{ time: Date; price: number }>()
      .x(d => xScale(d.time))
      .y(d => yScale(d.price))
      .curve(d3.curveMonotoneX); // Smooth curve

    // Select SVG container
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background", "#f9f9f9");

    // Remove previous line if it exists
    svg.selectAll(".price-line").remove();
    svg.selectAll("defs").remove();

    // Add Gradient for Line
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "lineGradient")
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "blue");

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "purple");

    // Append Line Path
    svg.append("path")
      .datum(formattedData)
      .attr("class", "price-line")
      .attr("d", lineGenerator)
      .attr("fill", "none")
      .attr("stroke", "url(#lineGradient)") // Apply gradient
      .attr("stroke-width", 2);

  }, [data]);

  return <svg ref={svgRef} className="mx-auto block"></svg>;
}

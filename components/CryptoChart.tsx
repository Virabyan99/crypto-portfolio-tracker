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

    const width = 800; // Increased for better visualization
    const height = 400;
    const margin = { top: 30, right: 40, bottom: 50, left: 60 };

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
      .nice() // Round up min/max for better axis readability
      .range([height - margin.bottom, margin.top]);

    const svg = d3.select(svgRef.current)
      .attr("width", "100%")  // Responsive width
      .attr("height", height)
      .style("background", "white")
      .style("border-radius", "10px")
      .style("box-shadow", "0 4px 10px rgba(0, 0, 0, 0.1)")
      .style("padding", "10px");

    // Remove previous elements
    svg.selectAll(".price-line, .x-axis, .y-axis, .x-label, .y-label, .grid-line, defs").remove();

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
      .attr("stop-color", "#4f46e5"); // Indigo color

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#9333ea"); // Purple color

    // Append Line Path
    svg.append("path")
      .datum(formattedData)
      .attr("class", "price-line")
      .attr("d", d3.line<{ time: Date; price: number }>()
        .x(d => xScale(d.time))
        .y(d => yScale(d.price))
        .curve(d3.curveMonotoneX))
      .attr("fill", "none")
      .attr("stroke", "url(#lineGradient)") // Apply gradient
      .attr("stroke-width", 3);

    // Add Grid Lines
    svg.append("g")
      .attr("class", "grid-line")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).tickSize(-height + margin.top + margin.bottom).tickFormat(() => ""))
      .selectAll("line")
      .attr("stroke", "#e5e7eb"); // Light gray

    svg.append("g")
      .attr("class", "grid-line")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).tickSize(-width + margin.left + margin.right).tickFormat(() => ""))
      .selectAll("line")
      .attr("stroke", "#e5e7eb"); // Light gray

    // Append X Axis
    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat((d: Date | d3.NumberValue) => 
        d3.timeFormat("%b %d")(d instanceof Date ? d : new Date(d as number))
      ))
      .selectAll("text")
      .attr("transform", "rotate(-30)")
      .attr("text-anchor", "end")
      .attr("fill", "#374151") // Dark gray text
      .attr("font-weight", "bold");

    // Append Y Axis
    svg.append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll("text")
      .attr("fill", "#374151") // Dark gray text
      .attr("font-weight", "bold");

    // X-Axis Label
    svg.append("text")
      .attr("class", "x-label")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("fill", "#374151")
      .text("Date");

    // Y-Axis Label
    svg.append("text")
      .attr("class", "y-label")
      .attr("x", -height / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("font-size", "14px")
      .attr("fill", "#374151")
      .text("Price (USD)");

  }, [data]);

  return (
    <div className="flex justify-center items-center w-full">
      <svg ref={svgRef} className="block"></svg>
    </div>
  );
}

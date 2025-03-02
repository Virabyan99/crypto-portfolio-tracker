"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CryptoChartProps {
  data: { time: number; price: number }[];
}

export default function CryptoChart({ data }: CryptoChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    price: number;
    date: string;
  } | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<[Date, Date] | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 400,
  });

  // Ref to control fade-in on initial mount (triggered by coin switch)
  const initialLoadRef = useRef(true);

  // Handle resizing
  useEffect(() => {
    if (!wrapperRef.current) return;

    const updateDimensions = () => {
      const width = wrapperRef.current?.clientWidth || 800;
      setDimensions({ width, height: 400 });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Render & update the chart with animated transitions and fade‑in effect on mount
  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const { width, height } = dimensions;
    const margin = { top: 30, right: 40, bottom: 50, left: 60 };

    // Convert times to JS Dates
    const formattedData = data.map((d) => ({
      time: new Date(d.time),
      price: d.price,
    }));

    // Define scales
    const xScale = d3
      .scaleTime()
      .domain(
        selectedDomain || (d3.extent(formattedData, (d) => d.time) as [Date, Date])
      )
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain([
        d3.min(formattedData, (d) => d.price) ?? 0,
        d3.max(formattedData, (d) => d.price) ?? 1,
      ])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Select/initialize the SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      // Dark chart background
      .style("background", "#1f2937") // Tailwind's gray-800
      .style("border-radius", "8px");

    // On initial mount (i.e. when coin changes), fade in the entire chart
    if (initialLoadRef.current) {
      svg.style("opacity", 0)
        .transition()
        .duration(500)
        .style("opacity", 1);
      initialLoadRef.current = false;
    }

    // Remove previous elements except the price line to enable smooth transitions
    svg.selectAll(".x-axis, .y-axis, .grid-line, .tooltip-line, .brush, defs").remove();

    // Add gradient for the line
    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "lineGradient")
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");
    // Example teal -> blue gradient
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#14b8a6"); // teal-500
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#3b82f6"); // blue-500

    // Define the line generator
    const lineGenerator = d3
      .line<{ time: Date; price: number }>()
      .x((d) => xScale(d.time))
      .y((d) => yScale(d.price))
      .curve(d3.curveMonotoneX);

    // Draw & animate the line chart (200ms for new data points)
    const linePath = svg.selectAll(".price-line").data([formattedData]);
    linePath
      .join(
        (enter) =>
          enter
            .append("path")
            .attr("class", "price-line")
            .attr("fill", "none")
            .attr("stroke", "url(#lineGradient)")
            .attr("stroke-width", 3)
            .attr("d", lineGenerator),
        (update) => update,
        (exit) => exit.remove()
      )
      .transition()
      .duration(200)
      .ease(d3.easeLinear)
      .attr("d", lineGenerator);

    // X Axis
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat((d: Date | d3.NumberValue) =>
      d3.timeFormat("%b %d")(d instanceof Date ? d : new Date(d as number))
    );
    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(xAxis as any)
      .selectAll("text")
      .attr("transform", "rotate(-30)")
      .attr("text-anchor", "end")
      .attr("fill", "#e5e7eb") // text-gray-200
      .attr("font-weight", "bold");

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(5);
    svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(yAxis as any)
      .selectAll("text")
      .attr("fill", "#e5e7eb")
      .attr("font-weight", "bold");

    // Optional grid lines (if desired)
    /*
    svg.selectAll("line.grid-line")
      .data(xScale.ticks(5))
      .join("line")
      .attr("class", "grid-line")
      .attr("x1", (d) => xScale(d))
      .attr("x2", (d) => xScale(d))
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom)
      .attr("stroke", "#374151")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2,2");
    */

    // Tooltip line for mouse interaction
    const tooltipLine = svg
      .append("line")
      .attr("class", "tooltip-line")
      .attr("stroke", "#9333ea") // purple-600
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4")
      .style("visibility", "hidden");

    // Brush selection for zooming
    const brush = d3
      .brushX()
      .extent([
        [margin.left, margin.top],
        [width - margin.right, height - margin.bottom],
      ])
      .on("end", (event) => {
        if (!event.selection) return;
        const [x0, x1] = event.selection;
        const newDomain = [xScale.invert(x0), xScale.invert(x1)] as [Date, Date];
        setSelectedDomain(newDomain);
      });
    svg.append("g").attr("class", "brush").call(brush);

    // Mouse interaction for tooltip updates
    svg.on("mousemove", (event) => {
      const [mouseX] = d3.pointer(event);

      // Find closest data point
      const closestPoint = formattedData.reduce((prev, curr) =>
        Math.abs(xScale(curr.time) - mouseX) < Math.abs(xScale(prev.time) - mouseX) ? curr : prev
      );

      setTooltip({
        x: xScale(closestPoint.time),
        y: yScale(closestPoint.price),
        price: closestPoint.price,
        date: d3.timeFormat("%b %d, %Y")(closestPoint.time),
      });

      // Position tooltip line
      tooltipLine
        .attr("x1", xScale(closestPoint.time))
        .attr("x2", xScale(closestPoint.time))
        .attr("y1", margin.top)
        .attr("y2", height - margin.bottom)
        .style("visibility", "visible");
    });

    // Hide tooltip when mouse leaves the SVG area
    svg.on("mouseleave", () => {
      setTooltip(null);
      tooltipLine.style("visibility", "hidden");
    });
  }, [data, dimensions, selectedDomain]);

  return (
    <div ref={wrapperRef} className="relative w-full mx-auto">
      <svg ref={svgRef} className="block w-full"></svg>

      {/* ShadCN Popover for Tooltip */}
      {tooltip && (
        <Popover open>
          <PopoverTrigger asChild>
            <div
              className="absolute"
              style={{
                top: tooltip.y - 30,
                left: tooltip.x + 10,
              }}
            />
          </PopoverTrigger>
          {/* Dark tooltip styling */}
          <PopoverContent className="bg-gray-800 border border-gray-700 text-gray-100 p-3 rounded-lg shadow-md text-sm">
            <strong>{tooltip.date}</strong>
            <br />
            <span className="text-teal-400 font-medium">
              Price: ${tooltip.price.toFixed(2)}
            </span>
          </PopoverContent>
        </Popover>
      )}

      {/* Reset Zoom Button */}
      {selectedDomain && (
        <button
          className="absolute top-3 right-3 bg-red-600 hover:bg-red-500 text-white 
                     px-3 py-1 rounded-3xl cursor-pointer transition-colors"
          onClick={() => setSelectedDomain(null)}
        >
          Reset Zoom
        </button>
      )}
    </div>
  );
}

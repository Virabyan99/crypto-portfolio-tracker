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

  // Render & update the chart with animated transitions
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
      .domain(selectedDomain || (d3.extent(formattedData, (d) => d.time) as [Date, Date]))
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
      .style("background", "white")
      .style("border-radius", "10px")
      .style("box-shadow", "0 4px 10px rgba(0, 0, 0, 0.1)")
      .style("padding", "10px");

    // Remove previous elements except the price line to enable smooth transitions
    svg.selectAll(".x-axis, .y-axis, .grid-line, .tooltip-line, .brush, defs").remove();

    // Add gradient for the line (recreate defs each time for simplicity)
    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "lineGradient")
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#4f46e5");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#9333ea");

    // Define the line generator
    const lineGenerator = d3
      .line<{ time: Date; price: number }>()
      .x((d) => xScale(d.time))
      .y((d) => yScale(d.price))
      .curve(d3.curveMonotoneX);

    // Bind data & animate the line chart using transitions (shorter duration)
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

    // Append X Axis
    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(5)
          .tickFormat((d: Date | d3.NumberValue) =>
            d3.timeFormat("%b %d")(d instanceof Date ? d : new Date(d as number))
          )
      )
      .selectAll("text")
      .attr("transform", "rotate(-30)")
      .attr("text-anchor", "end")
      .attr("fill", "#374151")
      .attr("font-weight", "bold");

    // Append Y Axis
    svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll("text")
      .attr("fill", "#374151")
      .attr("font-weight", "bold");

    // Tooltip line for mouse interaction
    const tooltipLine = svg
      .append("line")
      .attr("class", "tooltip-line")
      .attr("stroke", "#9333ea")
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
    <div ref={wrapperRef} className="relative w-full max-w-4xl mx-auto p-4">
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
          <PopoverContent className="bg-white border border-gray-200 p-3 rounded-lg shadow-md text-gray-800 text-sm">
            <strong>{tooltip.date}</strong>
            <br />
            <span className="text-blue-600 font-medium">
              Price: ${tooltip.price.toFixed(2)}
            </span>
          </PopoverContent>
        </Popover>
      )}

      {/* Reset Zoom Button */}
      {selectedDomain && (
        <button
          className="absolute top-5 right-5 bg-red-500 text-white px-3 py-1 rounded-3xl cursor-pointer"
          onClick={() => setSelectedDomain(null)}
        >
          X
        </button>
      )}
    </div>
  );
}

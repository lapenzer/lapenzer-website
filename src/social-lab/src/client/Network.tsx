import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import cytoscape, { Core } from "cytoscape";
import { View, Agent } from "../engine/types";
export const COLORS = [
  "#62dfbc",
  "#9d8bf2",
  "#f7b76b",
  "#6cb8f0",
  "#f17f9c",
  "#a7cb73",
  "#dc9df0",
  "#67ccd4",
];
export type GraphHandle = {
  fit: () => void;
  zoom: (by: number) => void;
  layout: (name: string) => void;
  png: () => string | undefined;
  svg: () => string;
};
export const Network = forwardRef<
  GraphHandle,
  {
    view: View;
    selected: number | null;
    onSelect: (id: number) => void;
    colorBy: string;
    search: string;
    minStrength: number;
    connect: boolean;
  }
>(
  (
    { view, selected, onSelect, colorBy, search, minStrength, connect },
    ref,
  ) => {
    const el = useRef<HTMLDivElement>(null),
      cy = useRef<Core | null>(null),
      initial = useRef(true),
      select = useRef(onSelect);
    select.current = onSelect;
    const color = (a: Agent) =>
      colorBy === "opinion"
        ? a.opinion < -0.2
          ? "#9d8bf2"
          : a.opinion > 0.2
            ? "#f7b76b"
            : "#62dfbc"
        : colorBy === "mood"
          ? a.mood < -0.15
            ? "#f17f9c"
            : a.mood > 0.15
              ? "#62dfbc"
              : "#6cb8f0"
          : colorBy === "agreeableness"
            ? `hsl(${150 + a.traits[3] * 30},${30 + a.traits[3] * 40}%,${38 + a.traits[3] * 26}%)`
            : COLORS[a.group % COLORS.length];
    useImperativeHandle(
      ref,
      () => ({
        fit: () => cy.current?.fit(undefined, 35),
        zoom: (by) => {
          const c = cy.current;
          if (c)
            c.zoom({
              level: Math.max(0.15, Math.min(5, c.zoom() * by)),
              renderedPosition: { x: c.width() / 2, y: c.height() / 2 },
            });
        },
        layout: (name) => {
          const c = cy.current;
          if (!c) return;
          if (name === "affiliation") {
            for (const node of c.nodes()) {
              const a = view.agents.find((a) => String(a.id) === node.id())!;
              node.position(position(a, view.config.groups));
            }
            c.fit(undefined, 60);
          } else
            c.layout({
              name: name === "force" ? "cose" : name,
              animate: view.agents.length < 250,
              randomize: false,
              padding: 65,
              animationDuration: 400,
              ...(name === "force"
                ? {
                    nodeRepulsion: () => 11000,
                    idealEdgeLength: () => 60,
                    numIter: 600,
                  }
                : {}),
            } as any).run();
        },
        png: () =>
          cy.current?.png({
            bg: "#0c1422",
            full: true,
            scale: 2,
            maxWidth: 3000,
            maxHeight: 2400,
          }),
        svg: () => {
          const c = cy.current;
          if (!c) return "";
          const box = c.elements().boundingBox(),
            pad = 35;
          const esc = (v: string) =>
            v.replace(
              /[<>&"]/g,
              (a) =>
                ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[a]!,
            );
          return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x1 - pad} ${box.y1 - pad} ${box.w + pad * 2} ${box.h + pad * 2}"><rect x="${box.x1 - pad}" y="${box.y1 - pad}" width="${box.w + pad * 2}" height="${box.h + pad * 2}" fill="#0c1422"/>${c
            .edges()
            .map(
              (e) =>
                `<line x1="${e.source().position("x")}" y1="${e.source().position("y")}" x2="${e.target().position("x")}" y2="${e.target().position("y")}" stroke="${e.data("weight") < 0 ? "#b76880" : "#4a7384"}" stroke-opacity=".5" stroke-width="1"/>`,
            )
            .join("")}${c
            .nodes()
            .map(
              (node) =>
                `<circle cx="${node.position("x")}" cy="${node.position("y")}" r="${node.width() / 2}" fill="${node.data("color")}"><title>${esc(node.data("name"))}</title></circle>`,
            )
            .join("")}</svg>`;
        },
      }),
      [view, colorBy],
    );
    function position(a: Agent, groups: number) {
      const cols = Math.ceil(Math.sqrt(Math.max(1, groups)));
      return {
        x: 100 + (a.group % cols) * 220 + (a.x - 0.5) * 185,
        y: 100 + Math.floor(a.group / cols) * 160 + (a.y - 0.5) * 125,
      };
    }
    useEffect(() => {
      if (!el.current) return;
      cy.current = cytoscape({
        container: el.current,
        minZoom: 0.15,
        maxZoom: 5,
        wheelSensitivity: 0.18,
        boxSelectionEnabled: false,
        hideEdgesOnViewport: view.agents.length > 350,
        style: [
          {
            selector: "node",
            style: {
              "background-color": "data(color)",
              width: "data(size)",
              height: "data(size)",
              "border-width": 1.5,
              "border-color": "#0c1422",
              label: "data(initials)",
              "font-size": 5,
              color: "#08251e",
              "text-valign": "center",
              "text-halign": "center",
              "font-weight": 600,
              "text-opacity": 0.85,
              "overlay-opacity": 0,
            },
          },
          {
            selector: "node:selected",
            style: {
              "border-width": 3,
              "border-color": "#eefbf6",
              "overlay-padding": 6,
              "overlay-color": "#62dfbc",
              "overlay-opacity": 0.1,
              "z-index": 10,
            },
          },
          {
            selector: "edge",
            style: {
              width: "data(width)",
              "line-color": "data(color)",
              opacity: 0.25,
              "curve-style": "haystack",
              "target-arrow-shape": "none",
            },
          },
          {
            selector: ".directed",
            style: {
              "curve-style": "bezier",
              "target-arrow-shape": "triangle",
              "target-arrow-color": "data(color)",
              "arrow-scale": 0.5,
            },
          },
          { selector: ".dim", style: { opacity: 0.12 } },
          { selector: ".hidden", style: { display: "none" } },
          { selector: ".selected-edge", style: { opacity: 0.7, width: 1.8 } },
        ],
      });
      cy.current.on("tap", "node", (e) =>
        select.current(Number(e.target.id())),
      );
      const observer = new ResizeObserver(() => cy.current?.resize());
      observer.observe(el.current);
      return () => {
        observer.disconnect();
        cy.current?.destroy();
        cy.current = null;
      };
    }, []);
    useEffect(() => {
      const c = cy.current;
      if (!c) return;
      const present = new Set(view.agents.map((a) => String(a.id)));
      c.batch(() => {
        c.nodes().forEach((node) => {
          if (!present.has(node.id())) node.remove();
        });
        for (const a of view.agents) {
          const data = {
            id: String(a.id),
            name: a.name,
            group: a.group,
            color: color(a),
            size: Math.min(27, 9 + Math.sqrt(a.degree) * 2),
            initials: a.name
              .split(" ")
              .slice(0, 2)
              .map((x) => x[0])
              .join(""),
          };
          const existing = c.getElementById(data.id);
          if (existing.length) existing.data(data);
          else c.add({ data, position: position(a, view.config.groups) });
        }
        const edges = new Set(view.edges.map((e) => "e" + e.id));
        c.edges().forEach((e) => {
          if (!edges.has(e.id())) e.remove();
        });
        for (const e of view.edges) {
          const data = {
            id: "e" + e.id,
            source: String(e.source),
            target: String(e.target),
            weight: e.weight,
            width: 0.45 + Math.abs(e.weight) * 1.8,
            color:
              e.weight < -0.1
                ? "#c4667d"
                : e.types.includes("friendship")
                  ? "#69c7aa"
                  : "#54728b",
          };
          const existing = c.getElementById(data.id);
          if (existing.length) existing.data(data);
          else c.add({ data, classes: view.config.directed ? "directed" : "" });
        }
      });
      if (initial.current && view.agents.length) {
        c.fit(undefined, 35);
        initial.current = false;
      }
    }, [view.agents, view.edges, colorBy]);
    useEffect(() => {
      const c = cy.current;
      if (!c) return;
      c.batch(() => {
        c.nodes().unselect();
        if (selected !== null) c.getElementById(String(selected)).select();
        c.elements().removeClass("dim");
        c.edges().removeClass("selected-edge");
        if (search) {
          const found = c
            .nodes()
            .filter(
              (n) =>
                n.data("name").toLowerCase().includes(search.toLowerCase()) ||
                n.id() === search,
            );
          c.elements().addClass("dim");
          found.closedNeighborhood().removeClass("dim");
        } else if (selected !== null)
          c.getElementById(String(selected))
            .connectedEdges()
            .addClass("selected-edge");
        c.edges().forEach((e) => {
          e.toggleClass("hidden", Math.abs(e.data("weight")) < minStrength);
        });
      });
    }, [selected, search, minStrength, view.edges]);
    return (
      <div
        ref={el}
        className={`network-surface ${connect ? "connect-mode" : ""}`}
        role="img"
        aria-label={`Interactive network with ${view.totalAgents} agents. Select an agent to inspect. Use search to find agents by name or ID.`}
      />
    );
  },
);

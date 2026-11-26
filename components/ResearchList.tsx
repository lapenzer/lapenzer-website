"use client";
import Link from "next/link";
import { useState } from "react";
import { research } from "@/lib/research";

export function ResearchList(){
  const [category,setCategory]=useState("All research");
  const categories=["All research",...new Set(research.map(paper=>paper.category))];
  const visible=category==="All research"?research:research.filter(paper=>paper.category===category);
  return <div className="ed-archive"><div className="ed-filters" role="group" aria-label="Filter research by category">{categories.map(name=><button type="button" aria-pressed={category===name} key={name} onClick={()=>setCategory(name)}>{name}</button>)}</div><p className="ed-archive-count" role="status">{visible.length} {visible.length===1?"entry":"entries"}</p><div className="ed-archive-grid">{visible.map(paper=><Link href={`/research/${paper.slug}`} key={paper.slug} className="ed-article"><div className="ed-card-meta"><span>{paper.category}</span><span>{paper.date}</span></div><h3>{paper.title}</h3><p>{paper.description}</p><div className="ed-article-bottom"><span>{paper.status}</span><span aria-hidden="true">↗</span></div></Link>)}</div></div>;
}

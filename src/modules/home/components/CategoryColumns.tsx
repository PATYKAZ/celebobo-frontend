"use client";

import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/shared/animations/Reveal";
import { Block } from "@/shared/ui/Block";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { PhotoBanner } from "./PhotoBanner";
import type { CategoryColumn } from "../types";

function Column({ col, index }: { col: CategoryColumn; index: number }) {
  return (
    <Reveal delay={index * 0.1} className="h-full">
      <Block pad="none" className="h-full px-5 pb-8 pt-[30px] sm:px-[30px]">
        <SectionHeader title={col.title} viewAllHref={col.href} />
        <PhotoBanner image={col.banner.image} href={col.href} label={col.title} overlay={col.banner.overlay} className="mt-6 h-[190px]" sizes="368px" contentClassName="flex flex-col justify-center px-[30px]">
          <p className="text-[14px] font-bold uppercase leading-[22.4px] text-white">
            {col.banner.lines.map((l) => (
              <span key={l} className="block">{l}</span>
            ))}
          </p>
        </PhotoBanner>

        <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-line-2/30 pt-7">
          {col.items.map((it) => (
            <Link key={it.name} href={it.href} className="group flex flex-col items-center">
              <span className="relative block size-[120px] max-w-full overflow-hidden rounded-full bg-chip ring-2 ring-transparent transition-all duration-500 group-hover:-translate-y-1.5 group-hover:ring-primary">
                <Image src={it.image} alt="" fill sizes="120px" className="object-cover transition-transform duration-700 group-hover:scale-125" />
              </span>
              <span className="mt-3 text-[14px] font-bold capitalize leading-[23.8px] transition-colors group-hover:text-primary">{it.name}</span>
              <span className="text-[12px] leading-[18px] text-ink-2">{it.count} articles</span>
            </Link>
          ))}
        </div>
      </Block>
    </Reveal>
  );
}

export function CategoryColumns({ columns }: { columns: CategoryColumn[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {columns.map((c, i) => (
        <Column key={c.title} col={c} index={i} />
      ))}
    </section>
  );
}

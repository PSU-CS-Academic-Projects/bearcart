"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  
  onPageChange?: (page: number) => void;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  const pages: (number | string)[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
  }

  return pages;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  function pageHref(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  // One interactive page control. Renders a callback button when onPageChange is
  // supplied (local-state mode), otherwise a URL <Link> button (default mode).
  function control(
    page: number,
    content: React.ReactNode,
    opts?: { active?: boolean; srLabel?: string }
  ) {
    const variant = opts?.active ? "default" : "outline";
    const inner = (
      <>
        {content}
        {opts?.srLabel && <span className="sr-only">{opts.srLabel}</span>}
      </>
    );
    if (onPageChange) {
      return (
        <Button
          type="button"
          variant={variant}
          size="icon"
          className="size-9"
          onClick={() => onPageChange(page)}
        >
          {inner}
        </Button>
      );
    }
    return (
      <Button asChild variant={variant} size="icon" className="size-9">
        <Link href={pageHref(page)}>{inner}</Link>
      </Button>
    );
  }

  function disabledControl(content: React.ReactNode, srLabel: string) {
    return (
      <Button variant="outline" size="icon" className="size-9" disabled>
        {content}
        <span className="sr-only">{srLabel}</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1">
      {currentPage > 1
        ? control(currentPage - 1, <CaretLeft className="size-4" />, { srLabel: "Previous page" })
        : disabledControl(<CaretLeft className="size-4" />, "Previous page")}

      {getPageNumbers(currentPage, totalPages).map((page, index) => (
        <span key={index}>
          {page === "..." ? (
            <span className="px-2 text-muted-foreground">...</span>
          ) : page === currentPage ? (
            <Button variant="default" size="icon" className="size-9">
              <span>{page}</span>
            </Button>
          ) : (
            control(page as number, page)
          )}
        </span>
      ))}

      {currentPage < totalPages
        ? control(currentPage + 1, <CaretRight className="size-4" />, { srLabel: "Next page" })
        : disabledControl(<CaretRight className="size-4" />, "Next page")}
    </div>
  );
}

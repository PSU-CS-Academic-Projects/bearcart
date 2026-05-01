"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
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

  const getPageNumbers = () => {
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
  };

  return (
    <div className="flex items-center justify-center gap-1">
      {currentPage > 1 ? (
        <Button asChild variant="outline" size="icon" className="size-9">
          <Link href={pageHref(currentPage - 1)}>
            <CaretLeft className="size-4" />
            <span className="sr-only">Previous page</span>
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="icon" className="size-9" disabled>
          <CaretLeft className="size-4" />
          <span className="sr-only">Previous page</span>
        </Button>
      )}

      {getPageNumbers().map((page, index) => (
        <span key={index}>
          {page === "..." ? (
            <span className="px-2 text-muted-foreground">...</span>
          ) : (
            <Button
              asChild={currentPage !== page}
              variant={currentPage === page ? "default" : "outline"}
              size="icon"
              className="size-9"
            >
              {currentPage === page ? (
                <span>{page}</span>
              ) : (
                <Link href={pageHref(page as number)}>{page}</Link>
              )}
            </Button>
          )}
        </span>
      ))}

      {currentPage < totalPages ? (
        <Button asChild variant="outline" size="icon" className="size-9">
          <Link href={pageHref(currentPage + 1)}>
            <CaretRight className="size-4" />
            <span className="sr-only">Next page</span>
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="icon" className="size-9" disabled>
          <CaretRight className="size-4" />
          <span className="sr-only">Next page</span>
        </Button>
      )}
    </div>
  );
}

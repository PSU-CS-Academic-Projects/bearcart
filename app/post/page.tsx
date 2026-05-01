import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { PostTypeSwitcher } from "@/components/post-type-switcher";
import { createClient } from "@/lib/supabase-server";

export const metadata = {
  title: "Create a Post - BearCart",
};

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function PostPage({ searchParams }: PageProps) {
  const { type } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?returnTo=/post");
  }

  return (
    <>
      <Navbar />
      <PostTypeSwitcher initialType={type === "request" ? "request" : "listing"} />
    </>
  );
}

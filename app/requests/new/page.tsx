import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { Navbar } from "@/components/navbar";
import { PostRequestForm } from "@/components/post-request-form";

export const metadata = {
  title: "Post a Request — PalMart",
};

export default async function PostRequestPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?returnTo=/requests/new");
  }

  return (
    <>
      <Navbar />
      <PostRequestForm />
    </>
  );
}

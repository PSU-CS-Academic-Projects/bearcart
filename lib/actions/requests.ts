"use server";

import { createClient } from "@/lib/supabase-server";
import { MAX_CURRENCY_AMOUNT } from "@/lib/currency";
import { moderateTextOrThrow, moderateImagesOrThrow } from "@/lib/moderation";
import { logActivity, type ActivityLogType } from "@/lib/activity-log";
import { processToWebp } from "@/lib/image-processing";
import { enforceRateLimit, getClientIp } from "@/lib/ratelimit";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RequestUrgency = "not_urgent" | "moderate" | "urgent";
export type RequestStatus = "open" | "fulfilled" | "closed";

export interface RequestFilters {
  search?: string;
  category?: string;
  categories?: string[];
  urgency?: string;
  urgencies?: string[];
  minBudget?: number;
  maxBudget?: number;
  page?: number;
  pageSize?: number;
}

export interface RequestImageRow {
  id: string;
  image_url: string;
  order: number;
}

export interface RequestRow {
  id: string;
  slug: string;
  requester_id: string;
  title: string;
  description: string | null;
  category: string;
  budget_min: number | null;
  budget_max: number | null;
  is_negotiable: boolean;
  urgency: RequestUrgency;
  status: RequestStatus;
  is_delisted: boolean;
  created_at: string;
  request_images: RequestImageRow[];
  requester: {
    id: string;
    slug?: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    role: string;
    college: string | null;
    created_at: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

async function uploadRequestImage(
  requesterId: string,
  requestId: string,
  base64Data: string
): Promise<string> {
  const supabase = await createClient();

  // Rate limit: 10 image uploads per minute per ID.
  await enforceRateLimit("imageUpload", `user:${requesterId}`);

  const match = base64Data.match(/^data:(image\/(jpeg|png|webp));base64,(.+)$/);
  if (!match) throw new Error("Invalid image format. Only JPG, JPEG, PNG, and WEBP are allowed.");

  const rawBase64 = match[3];

  const binaryString = atob(rawBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  if (bytes.byteLength > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Image is larger than the 5MB limit.");
  }

  // Flatten transparency → white and convert to WebP before storing.
  const processed = await processToWebp(bytes, { quality: 85 });

  const fileId = crypto.randomUUID();
  const filePath = `${requesterId}/${requestId}/${fileId}.webp`;

  const { error } = await supabase.storage
    .from("request_images")
    .upload(filePath, processed, { contentType: "image/webp", upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage.from("request_images").getPublicUrl(filePath);
  return urlData.publicUrl;
}

async function deleteRequestImageByUrl(publicUrl: string): Promise<void> {
  const supabase = await createClient();
  const bucketUrl = `/storage/v1/object/public/request_images/`;
  const idx = publicUrl.indexOf(bucketUrl);
  if (idx === -1) return; // Not our bucket, ignore
  const filePath = decodeURIComponent(publicUrl.slice(idx + bucketUrl.length));
  await supabase.storage.from("request_images").remove([filePath]);
}

// ─── READ (list) ──────────────────────────────────────────────────────────────

export async function getRequests(filters: RequestFilters = {}) {
  const supabase = await createClient();
  const {
    search,
    minBudget,
    maxBudget,
    page = 1,
    pageSize = 20,
  } = filters;

  const resolvedCategories: string[] =
    filters.categories && filters.categories.length > 0
      ? filters.categories
      : filters.category
        ? filters.category.split(",").map((c) => c.trim()).filter(Boolean)
        : [];

  const resolvedUrgencies: string[] =
    filters.urgencies && filters.urgencies.length > 0
      ? filters.urgencies
      : filters.urgency
        ? filters.urgency.split(",").map((u) => u.trim()).filter(Boolean)
        : [];

  // Rate limit text searches (30/min per IP). Plain browsing/pagination is not
  // limited — only an actual search query counts.
  if (search && search.trim()) {
    await enforceRateLimit("search", `ip:${await getClientIp()}`);
  }

  let query = supabase
    .from("requests")
    .select(
      `
      id, slug, requester_id, title, description, category,
      budget_min, budget_max, is_negotiable, urgency, status, is_delisted, created_at,
      request_images ( id, image_url, "order" ),
      requester:users!requests_requester_id_fkey (
        id, slug, full_name, first_name, last_name, avatar_url, role, college, created_at
      )
    `,
      { count: "exact" }
    )
    .eq("status", "open")
    .eq("is_delisted", false)
    .is("deleted_at", null);

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }
  if (resolvedCategories.length === 1) {
    query = query.ilike("category", resolvedCategories[0]);
  } else if (resolvedCategories.length > 1) {
    query = query.in("category", resolvedCategories);
  }
  if (resolvedUrgencies.length === 1) {
    query = query.eq("urgency", resolvedUrgencies[0]);
  } else if (resolvedUrgencies.length > 1) {
    query = query.in("urgency", resolvedUrgencies);
  }
  // Budget overlap: a request with budget_min..budget_max overlaps the
  // user's [min, max] window when budget_max >= min AND budget_min <= max.
  if (minBudget !== undefined) {
    query = query.gte("budget_max", minBudget);
  }
  if (maxBudget !== undefined) {
    query = query.lte("budget_min", maxBudget);
  }

  query = query.order("created_at", { ascending: false });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(`Failed to fetch requests: ${error.message}`);

  return {
    requests: (data ?? []) as unknown as RequestRow[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}

// ─── READ (recent for homepage tab) ──────────────────────────────────────────

export async function getRecentRequests(limit = 10): Promise<RequestRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("requests")
    .select(`
      id, slug, requester_id, title, description, category,
      budget_min, budget_max, is_negotiable, urgency, status, is_delisted, created_at,
      request_images ( id, image_url, "order" ),
      requester:users!requests_requester_id_fkey (
        id, slug, full_name, first_name, last_name, avatar_url, role, college, created_at
      )
    `)
    .eq("status", "open")
    .eq("is_delisted", false)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as unknown as RequestRow[];
}

// ─── READ (single) ───────────────────────────────────────────────────────────

export async function getRequestById(id: string): Promise<RequestRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("requests")
    .select(`
      id, slug, requester_id, title, description, category,
      budget_min, budget_max, is_negotiable, urgency, status, is_delisted, created_at,
      request_images ( id, image_url, "order" ),
      requester:users!requests_requester_id_fkey (
        id, slug, full_name, first_name, last_name, avatar_url, role, college, created_at
      )
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    if (error.message.includes("invalid input syntax")) return null;
    return null;
  }
  if (!data) return null;
  return data as unknown as RequestRow;
}

export async function getRequestBySlug(slug: string): Promise<RequestRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("requests")
    .select(`
      id, slug, requester_id, title, description, category,
      budget_min, budget_max, is_negotiable, urgency, status, is_delisted, created_at,
      request_images ( id, image_url, "order" ),
      requester:users!requests_requester_id_fkey (
        id, slug, full_name, first_name, last_name, avatar_url, role, college, created_at
      )
    `)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as RequestRow;
}

// ─── READ (similar — same category, exclude current) ─────────────────────────

export async function getSimilarRequests(
  requestId: string,
  category: string,
  limit = 5
): Promise<RequestRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("requests")
    .select(`
      id, slug, requester_id, title, description, category,
      budget_min, budget_max, is_negotiable, urgency, status, is_delisted, created_at,
      request_images ( id, image_url, "order" ),
      requester:users!requests_requester_id_fkey (
        id, slug, full_name, first_name, last_name, avatar_url, role, college, created_at
      )
    `)
    .ilike("category", category)
    .eq("status", "open")
    .eq("is_delisted", false)
    .is("deleted_at", null)
    .neq("id", requestId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as unknown as RequestRow[];
}

// ─── READ (by requester — for profile) ───────────────────────────────────────

export async function getRequestsByRequester(
  requesterId: string,
  status?: RequestStatus
): Promise<RequestRow[]> {
  const supabase = await createClient();

  // Delisted requests are only visible to their owner and to admins.
  const { data: { user } } = await supabase.auth.getUser();
  let canSeeDelisted = !!user && user.id === requesterId;
  if (user && !canSeeDelisted) {
    const { data: viewer } = await supabase.from("users").select("is_admin").eq("id", user.id).single();
    canSeeDelisted = !!viewer?.is_admin;
  }

  let query = supabase
    .from("requests")
    .select(`
      id, slug, requester_id, title, description, category,
      budget_min, budget_max, is_negotiable, urgency, status, is_delisted, created_at,
      request_images ( id, image_url, "order" ),
      requester:users!requests_requester_id_fkey (
        id, slug, full_name, first_name, last_name, avatar_url, role, college, created_at
      )
    `)
    .eq("requester_id", requesterId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (!canSeeDelisted) {
    query = query.eq("is_delisted", false);
  }

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as unknown as RequestRow[];
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export interface CreateRequestInput {
  title: string;
  description: string;
  category: string;
  budget_min: number | null;
  budget_max: number | null;
  urgency: RequestUrgency;
  /** Up to 3 base64-encoded images */
  photos: string[];
}

export async function createRequest(input: CreateRequestInput): Promise<{ id: string; slug: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Rate limit: 5 new requests per minute per ID.
  await enforceRateLimit("postRequest", `user:${user.id}`);

  const { data: banRow } = await supabase.from("users").select("ban_type").eq("id", user.id).single();
  if (banRow?.ban_type === "post" || banRow?.ban_type === "full") {
    throw new Error("Your account is banned from posting. Contact an admin if you believe this is a mistake.");
  }

  if (input.budget_min !== null && input.budget_min < 1) {
    throw new Error("Minimum budget must be at least ₱1");
  }
  if (input.budget_min !== null && input.budget_min > MAX_CURRENCY_AMOUNT) {
    throw new Error("Minimum budget cannot exceed ₱999,999");
  }
  if (input.budget_max !== null && input.budget_max < 1) {
    throw new Error("Maximum budget must be at least ₱1");
  }
  if (input.budget_max !== null && input.budget_max > MAX_CURRENCY_AMOUNT) {
    throw new Error("Maximum budget cannot exceed ₱999,999");
  }
  if (
    input.budget_min !== null &&
    input.budget_max !== null &&
    input.budget_min > input.budget_max
  ) {
    throw new Error("Minimum budget must be less than or equal to maximum budget");
  }

  // 0. Content moderation — runs before any DB write.
  await moderateTextOrThrow([
    { label: "title", value: input.title },
    { label: "description", value: input.description },
  ]);
  await moderateImagesOrThrow(input.photos);

  // 1. Insert request row
  const { data: request, error: insertErr } = await supabase
    .from("requests")
    .insert({
      requester_id: user.id,
      title: input.title,
      description: input.description || null,
      category: input.category,
      budget_min: input.budget_min,
      budget_max: input.budget_max,
      is_negotiable: false,
      urgency: input.urgency,
    })
    .select("id, slug")
    .single();

  if (insertErr) throw new Error(`Failed to create request: ${insertErr.message}`);

  // 2. Upload photos and insert request_images rows
  const imageRows: { request_id: string; image_url: string; order: number }[] = [];
  for (let i = 0; i < input.photos.length; i++) {
    try {
      const url = await uploadRequestImage(user.id, request.id, input.photos[i]);
      imageRows.push({ request_id: request.id, image_url: url, order: i });
    } catch (err) {
      console.error(`Failed to upload request photo ${i}:`, err);
    }
  }

  if (imageRows.length > 0) {
    await supabase.from("request_images").insert(imageRows);
  }

  return { id: request.id, slug: request.slug as string };
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export interface UpdateRequestInput {
  requestId: string;
  title: string;
  description: string;
  category: string;
  budget_min: number | null;
  budget_max: number | null;
  urgency: RequestUrgency;
  /**
   * Full photo list in final display order. Existing photos are http(s) URLs,
   * newly added photos are base64 data URLs. Position 0 becomes the cover.
   */
  orderedPhotos: string[];
  /** Image IDs that were removed by the user */
  removedImageIds: string[];
}

export async function updateRequest(input: UpdateRequestInput): Promise<{ id: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify ownership and editable status
  const { data: req } = await supabase
    .from("requests")
    .select("requester_id, status")
    .eq("id", input.requestId)
    .single();

  if (!req) throw new Error("Request not found");
  if (req.requester_id !== user.id) throw new Error("Not authorized");
  if (req.status !== "open") throw new Error("This request cannot be edited");

  if (
    input.budget_min !== null &&
    input.budget_max !== null &&
    input.budget_min > input.budget_max
  ) {
    throw new Error("Minimum budget must be less than or equal to maximum budget");
  }
  if (input.budget_min !== null && input.budget_min < 1) {
    throw new Error("Minimum budget must be at least ₱1");
  }
  if (input.budget_min !== null && input.budget_min > MAX_CURRENCY_AMOUNT) {
    throw new Error("Minimum budget cannot exceed ₱999,999");
  }
  if (input.budget_max !== null && input.budget_max < 1) {
    throw new Error("Maximum budget must be at least ₱1");
  }
  if (input.budget_max !== null && input.budget_max > MAX_CURRENCY_AMOUNT) {
    throw new Error("Maximum budget cannot exceed ₱999,999");
  }

  const newPhotos = input.orderedPhotos.filter((p) => p.startsWith("data:"));

  // 0. Content moderation — text plus any newly added images.
  await moderateTextOrThrow([
    { label: "title", value: input.title },
    { label: "description", value: input.description },
  ]);
  await moderateImagesOrThrow(newPhotos);

  // 1. Update fields
  const { error: updateError } = await supabase
    .from("requests")
    .update({
      title: input.title,
      description: input.description || null,
      category: input.category,
      budget_min: input.budget_min,
      budget_max: input.budget_max,
      is_negotiable: false,
      urgency: input.urgency,
    })
    .eq("id", input.requestId)
    .eq("requester_id", user.id);

  if (updateError) throw new Error(`Failed to update request: ${updateError.message}`);

  // 2. Delete removed images
  if (input.removedImageIds.length > 0) {
    const { data: removed } = await supabase
      .from("request_images")
      .select("id, image_url")
      .in("id", input.removedImageIds);

    if (removed) {
      for (const img of removed) {
        try { await deleteRequestImageByUrl(img.image_url); } catch { /* ignore */ }
      }
    }
    await supabase.from("request_images").delete().in("id", input.removedImageIds);
  }

  // 3. Upload new photos, mapping each base64 entry to its uploaded URL while
  //    preserving the caller's interleaved display order.
  const resolvedUrls: string[] = [];
  for (const photo of input.orderedPhotos) {
    if (photo.startsWith("data:")) {
      try {
        const url = await uploadRequestImage(user.id, input.requestId, photo);
        resolvedUrls.push(url);
      } catch (err) {
        console.error("Failed to upload new photo:", err);
      }
    } else {
      resolvedUrls.push(photo);
    }
  }

  // Insert rows for the freshly uploaded images (existing rows are reordered below).
  const { data: existingRows } = await supabase
    .from("request_images")
    .select("id, image_url")
    .eq("request_id", input.requestId);
  const existingUrls = new Set((existingRows ?? []).map((r) => r.image_url));

  const newRows = resolvedUrls
    .filter((url) => !existingUrls.has(url))
    .map((url) => ({
      request_id: input.requestId,
      image_url: url,
      order: resolvedUrls.indexOf(url),
    }));
  if (newRows.length > 0) {
    await supabase.from("request_images").insert(newRows);
  }

  // 4. Reorder ALL images from their position in the final ordered list.
  //    Requests have no is_cover column — cover is simply the lowest order.
  const { data: allImages } = await supabase
    .from("request_images")
    .select("id, image_url")
    .eq("request_id", input.requestId);

  if (allImages) {
    const updates = allImages.map((img) => {
      const order = resolvedUrls.indexOf(img.image_url);
      return supabase
        .from("request_images")
        .update({ order: order === -1 ? 999 : order })
        .eq("id", img.id);
    });
    await Promise.all(updates);
  }

  return { id: input.requestId };
}

// ─── STATUS CHANGES ──────────────────────────────────────────────────────────

async function setRequestStatus(
  requestId: string,
  status: RequestStatus,
  alsoSoftDelete = false
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const update: Record<string, unknown> = { status };
  if (alsoSoftDelete) update.deleted_at = new Date().toISOString();

  const { error } = await supabase
    .from("requests")
    .update(update)
    .eq("id", requestId)
    .eq("requester_id", user.id);

  if (error) throw new Error(`Failed to update request: ${error.message}`);
}

/** Audit: record a user-driven request status change to the activity feed. */
async function logRequestStatusChange(requestId: string, type: ActivityLogType): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const [{ data: req }, { data: actor }] = await Promise.all([
    supabase.from("requests").select("title").eq("id", requestId).single(),
    supabase.from("users").select("full_name").eq("id", user.id).single(),
  ]);
  await logActivity({
    type,
    actorId: user.id,
    actorName: actor?.full_name ?? null,
    targetType: "request",
    targetId: requestId,
    targetTitle: req?.title ?? null,
  });
}

export async function markRequestFulfilled(requestId: string): Promise<void> {
  await setRequestStatus(requestId, "fulfilled");
  await logRequestStatusChange(requestId, "request_fulfilled");
}

export async function closeRequest(requestId: string): Promise<void> {
  await setRequestStatus(requestId, "closed");
  await logRequestStatusChange(requestId, "request_closed");
}

export async function deleteRequest(requestId: string): Promise<void> {
  return setRequestStatus(requestId, "closed", true);
}

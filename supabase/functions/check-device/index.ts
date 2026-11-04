// Supabase Edge Function (Deno): qurilma cheklovi (bitta hisob — ko'pi bilan MAX_DEVICES qurilma).
//
//   register_device {device_id, device_info} — kirishda va har sessiya tiklanganda (Google ham).
//                     Limit to'lgan bo'lsa 409 DEVICE_LIMIT_EXCEEDED + faol qurilmalar ro'yxati.
//   list_devices                             — faol qurilmalar (joriysi belgilangan).
//   remove_device   {device_id}              — shu qurilmadan chiqish.
//   revoke_device   {target_device_id}       — boshqa qurilmani chiqarish (haftasiga ko'pi bilan 3 marta:
//                                              hisobni navbatma-navbat "ulashish"ning oldini oladi).
//
// Cheklov haqiqatan server tomonida: premium kontent (get-questions, get-video-url) faqat
// ro'yxatdagi qurilmaga beriladi. STALE_DAYS kun ko'rinmagan qurilma avtomatik bo'shaydi.

import { jsonResponse, preflight } from "../_shared/cors.ts";
import { adminClient, getUser } from "../_shared/supabase.ts";
import { isValidDeviceId, MAX_DEVICES, STALE_DAYS } from "../_shared/device.ts";

const MAX_REVOKES_PER_WEEK = 3;

type DeviceRow = { device_id: string; device_info: string | null; last_seen: string; created_at: string };

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "POST") return jsonResponse(req, { error: "method_not_allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return jsonResponse(req, { error: "not_authenticated" }, 401);
    const sb = adminClient();

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return jsonResponse(req, { error: "bad_request" }, 400); }
    const action = String(body.action ?? "");
    const deviceId = body.device_id;
    const info = typeof body.device_info === "string" ? body.device_info.slice(0, 160) : null;

    // Eskirgan qurilmalarni bo'shatish
    await sb.from("user_sessions").delete().eq("user_id", user.id)
      .lt("last_seen", new Date(Date.now() - STALE_DAYS * 86_400_000).toISOString());

    const listDevices = async (): Promise<DeviceRow[]> => {
      const { data, error } = await sb.from("user_sessions")
        .select("device_id, device_info, last_seen, created_at")
        .eq("user_id", user.id)
        .order("last_seen", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DeviceRow[];
    };
    const publicList = (rows: DeviceRow[], current: unknown) =>
      rows.map((r) => ({ ...r, current: r.device_id === current }));

    if (action === "register_device") {
      if (!isValidDeviceId(deviceId)) return jsonResponse(req, { error: "bad_device_id" }, 400);
      const rows = await listDevices();
      const known = rows.some((r) => r.device_id === deviceId);
      if (!known && rows.length >= MAX_DEVICES) {
        return jsonResponse(req, {
          error: `Bu hisob allaqachon ${MAX_DEVICES} ta qurilmada ochiq.`,
          code: "DEVICE_LIMIT_EXCEEDED",
          max_devices: MAX_DEVICES,
          devices: publicList(rows, deviceId),
        }, 409);
      }
      const { error } = await sb.from("user_sessions").upsert({
        user_id: user.id,
        device_id: deviceId,
        device_info: info,
        last_seen: new Date().toISOString(),
      }, { onConflict: "user_id,device_id" });
      if (error) throw error;
      return jsonResponse(req, { success: true });
    }

    if (action === "list_devices") {
      return jsonResponse(req, { success: true, max_devices: MAX_DEVICES, devices: publicList(await listDevices(), deviceId) });
    }

    if (action === "remove_device") {
      if (!isValidDeviceId(deviceId)) return jsonResponse(req, { error: "bad_device_id" }, 400);
      const { error } = await sb.from("user_sessions").delete().eq("user_id", user.id).eq("device_id", deviceId);
      if (error) throw error;
      return jsonResponse(req, { success: true });
    }

    if (action === "revoke_device") {
      const target = body.target_device_id;
      if (!isValidDeviceId(target)) return jsonResponse(req, { error: "bad_device_id" }, 400);
      if (target === deviceId) return jsonResponse(req, { error: "use_remove_device" }, 400);

      const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
      const { count, error: cErr } = await sb.from("device_removals")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id).gte("created_at", since);
      if (cErr) throw cErr;
      if ((count ?? 0) >= MAX_REVOKES_PER_WEEK) {
        return jsonResponse(req, {
          error: "Bu hafta boshqa qurilmalarni chiqarish limiti tugadi. Qurilmaning o'zidan chiqing yoki keyinroq urinib ko'ring.",
          code: "REVOKE_LIMIT",
        }, 429);
      }
      const { data: del, error } = await sb.from("user_sessions").delete()
        .eq("user_id", user.id).eq("device_id", target).select("device_id");
      if (error) throw error;
      if (del && del.length > 0) {
        await sb.from("device_removals").insert({ user_id: user.id, device_id: target });
      }
      return jsonResponse(req, { success: true, removed: (del ?? []).length });
    }

    return jsonResponse(req, { error: "unknown_action" }, 400);
  } catch (e) {
    console.error("check-device:", e);
    return jsonResponse(req, { error: "server_error" }, 500);
  }
});

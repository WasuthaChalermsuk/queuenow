// ============================================
// QueueNow — LINE Messaging API Helper
// ============================================

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
const LINE_PUSH_API = "https://api.line.me/v2/bot/message/push";

export interface LinePushMessage {
  to: string;
  messages: Array<{
    type: "text";
    text: string;
  }>;
}

/**
 * ส่งข้อความ LINE ไปยังผู้ใช้ผ่าน LINE Messaging API (Push)
 *
 * @param userId - LINE User ID ของผู้รับ
 * @param message - ข้อความที่ต้องการส่ง
 * @returns true ถ้าส่งสำเร็จ, false ถ้าส่งไม่สำเร็จ
 */
export async function sendLineMessage(userId: string, message: string): Promise<boolean> {
  // ไม่ต้องส่งถ้าไม่ได้ตั้งค่า LINE
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.warn("[LINE] LINE_CHANNEL_ACCESS_TOKEN ไม่ได้ตั้งค่า — ข้ามการส่งข้อความ");
    return false;
  }

  if (!userId) {
    console.warn("[LINE] ไม่มี LINE user ID — ข้ามการส่งข้อความ");
    return false;
  }

  const body: LinePushMessage = {
    to: userId,
    messages: [
      {
        type: "text",
        text: message,
      },
    ],
  };

  try {
    const response = await fetch(LINE_PUSH_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + LINE_CHANNEL_ACCESS_TOKEN,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[LINE] Push message failed (${response.status}):`, errorText);
      return false;
    }

    const data = await response.json();
    console.log("[LINE] Push message sent successfully:", JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("[LINE] Push message error:", error);
    return false;
  }
}

/**
 * สร้างข้อความแจ้งเตือนสถานะ CONFIRMED
 */
export function buildConfirmedMessage(params: {
  bookingNumber: string;
  date: string;
  time: string;
  serviceName: string;
  shopName?: string;
}): string {
  const { bookingNumber, date, time, serviceName, shopName } = params;
  let msg = `✅ คิว #${bookingNumber} ของคุณได้รับการยืนยันแล้ว\n`;
  msg += `📅 วันที่: ${date}\n`;
  msg += `⏰ เวลา: ${time}\n`;
  msg += `💇 บริการ: ${serviceName}`;
  if (shopName) {
    msg += `\n🏪 ร้าน: ${shopName}`;
  }
  msg += `\n\nกรุณามาถึงก่อนเวลานัดหมาย ขอบคุณที่ใช้บริการ QueueNow 🙏`;
  return msg;
}

/**
 * สร้างข้อความแจ้งเตือนสถานะ CANCELLED
 */
export function buildCancelledMessage(params: {
  bookingNumber: string;
  date: string;
  time: string;
  serviceName: string;
  reason?: string;
  shopName?: string;
}): string {
  const { bookingNumber, date, time, serviceName, reason, shopName } = params;
  let msg = `❌ ขออภัย คิว #${bookingNumber} ถูกยกเลิก\n`;
  msg += `📅 วันที่: ${date}\n`;
  msg += `⏰ เวลา: ${time}\n`;
  msg += `💇 บริการ: ${serviceName}`;
  if (shopName) {
    msg += `\n🏪 ร้าน: ${shopName}`;
  }
  if (reason) {
    msg += `\n📝 เหตุผล: ${reason}`;
  }
  msg += `\n\nหากต้องการจองใหม่ สามารถจองผ่าน QueueNow ได้เลย 🙏`;
  return msg;
}

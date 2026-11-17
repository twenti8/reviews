import type { StoreState } from '../types/store';
import { DEFAULT_CUSTOM_COLORS } from './themes';

export const DEFAULT_STORE_STATE: StoreState = {
  storeInfo: {
    name: 'Mellow Bunny Studio',
    bio: 'ของขวัญแฮนด์เมด กิ๊ฟช็อป และเครื่องประดับสไตล์มินิมอลพาสเทล\nแพ็กอย่างตั้งใจทุกออเดอร์ พร้อมการ์ดขอบคุณลายน่ารัก ♡\nเปิดรับออเดอร์ทุกวัน · จัดส่งรอบเช้า 10:00 น.',
  },
  theme: {
    presetId: 'pastel-pink',
    customColors: { ...DEFAULT_CUSTOM_COLORS },
  },
  avatarUrl: '/src/assets/images/store_avatar_mascot_1794953500088.jpg',
  bannerUrl: '/src/assets/images/store_banner_pastel_1794953500678.jpg',
  musicConfig: {
    youtubeUrl: 'https://www.youtube.com/watch?v=lTRiuFIWV54',
    title: 'Lofi Pastel Café · Chill Beats to Browse & Unbox ♡',
    coverUrl: '/src/assets/images/music_cover_lofi_1794953501684.jpg',
  },
  creditHighlights: [
    {
      id: 'credit-1',
      imageUrl: '/src/assets/images/credit_slip_1_1794953501644.jpg',
      caption: 'กล่องของขวัญผูกโบว์ซาติน — ออเดอร์คุณมะปราง',
    },
    {
      id: 'credit-2',
      imageUrl: '/src/assets/images/credit_slip_2_1794953501077.jpg',
      caption: 'ซองบับเบิ้ลพาสเทล + สติกเกอร์เดซี่ — ส่งไวทันใจ',
    },
  ],
  adminPin: '1234',
  reviews: [
    {
      id: 'rev-108',
      name: 'น้องมิ้นท์ ♡',
      product: 'เซตกล่องของขวัญ Bunny Ribbon',
      rating: 5,
      comment: 'แพ็กของน่ารักมากกก เปิดกล่องมามีกลิ่นหอมอ่อนๆ กับการ์ดเขียนมือ ประทับใจสุดๆ เลยค่ะ',
      date: '16/11/2026 19:42',
    },
    {
      id: 'rev-107',
      name: 'คุณพลอยใส',
      product: 'จานเซรามิกพาสเทลลายจุด',
      rating: 5,
      comment: 'ห่อกันกระแทกหนาแน่นมาก น้องถึงมือปลอดภัยไม่มีรอยเลย สีจริงละมุนกว่าในรูปอีกค่ะ',
      date: '15/11/2026 14:18',
    },
    {
      id: 'rev-106',
      name: 'K.Beam',
      product: 'พวงกุญแจเดซี่แฮนด์เมด',
      rating: 5,
      comment: 'งานละเอียดมาก แม่ค้าตอบแชทน่ารัก ส่งของไวมาก สั่งซ้ำรอบที่สามแล้วค่า',
      date: '14/11/2026 11:05',
    },
    {
      id: 'rev-105',
      name: 'ฝ้ายฟู',
      product: 'เซตเครื่องเขียน Pastel Desk',
      rating: 4,
      comment: 'สีตรงปก วัสดุดีเกินราคา ซองใส่น่ารักจนไม่กล้าแกะทิ้งเลยค่ะ',
      date: '12/11/2026 16:50',
    },
    {
      id: 'rev-104',
      name: 'Aommy',
      product: 'เข็มกลัดกระต่าย Mellow',
      rating: 5,
      comment: 'ซื้อเป็นของขวัญวันเกิดเพื่อน เพื่อนชอบมากค่ะ ไว้จะมาอุดหนุนเซตอื่นเพิ่มนะคะ',
      date: '10/11/2026 20:15',
    },
    {
      id: 'rev-103',
      name: 'คุณน้ำหวาน',
      product: 'เทียนหอมวนิลลามิลค์',
      rating: 5,
      comment: 'กลิ่นละมุนมาก จุดในห้องนอนแล้วผ่อนคลายสุดๆ แพ็กเกจเรียบหรูน่ารักมากค่ะ',
      date: '08/11/2026 13:27',
    },
    {
      id: 'rev-102',
      name: 'Tae & Mild',
      product: 'เซตของขวัญคู่รัก Pastel Box',
      rating: 5,
      comment: 'สั่งด่วนให้ทันวันครบรอบ ร้านช่วยจัดส่งให้ทันเวลาเป๊ะ ประทับใจบริการมากๆ ครับ',
      date: '05/11/2026 10:12',
    },
  ],
};

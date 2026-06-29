import {
  ChangeEvent,
  CSSProperties,
  DragEvent,
  PointerEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Armchair,
  Award,
  CalendarDays,
  Camera,
  CheckCircle2,
  Flame,
  Home,
  ImagePlus,
  Medal,
  Pencil,
  RotateCcw,
  Settings,
  Shirt,
  ShoppingBag,
  Sparkles,
  Trash2,
  Trophy,
  Upload,
  Utensils,
} from 'lucide-react';

type PersonId = 'person_a' | 'person_b';
type StoreCategory = 'food' | 'furniture' | 'clothes';
type AppView = 'score' | 'room';

interface Person {
  id: PersonId;
  name: string;
  color: string;
}

interface PhotoEntry {
  id: string;
  personId: PersonId;
  name: string;
  dataUrl: string;
  points: number;
  createdAt: string;
  driveFileId?: string;
  driveViewLink?: string;
  driveThumbnailLink?: string;
}

interface PurchaseEntry {
  id: string;
  personId: PersonId;
  itemId: string;
  itemName: string;
  category: StoreCategory;
  price: number;
  purchasedAt: string;
}

interface RoomPlacement {
  id: string;
  purchaseId: string;
  itemId: string;
  itemName: string;
  personId: PersonId;
  xRatio: number;
  yRatio: number;
  zIndex: number;
}

interface ScoreState {
  people: Person[];
  entries: PhotoEntry[];
  purchases: PurchaseEntry[];
  roomPlacements: RoomPlacement[];
}

interface DriveConfig {
  clientId: string;
  folderId: string;
}

interface BaseStats {
  totalPhotos: number;
  todayPhotos: number;
  earnedPoints: number;
  spentPoints: number;
  balancePoints: number;
  streakDays: number;
}

interface PersonStats extends BaseStats {
  badges: string[];
}

interface StoreItem {
  id: string;
  category: StoreCategory;
  name: string;
  description: string;
  price: number;
  icon: LucideIcon;
}

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
          }) => GoogleTokenClient;
        };
      };
    };
  }
}

const STORAGE_KEY = 'photo-score-state:v2';
const DRIVE_CONFIG_KEY = 'photo-score-google-drive-config:v1';
const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const FISH_PER_PHOTO = 5;

const defaultState: ScoreState = {
  people: [
    { id: 'person_a', name: 'Tôi', color: '#2f6d5f' },
    { id: 'person_b', name: 'Cậu iu', color: '#c96d63' },
  ],
  entries: [],
  purchases: [],
  roomPlacements: [],
};

const storeCategories: Array<{ id: StoreCategory; label: string; icon: LucideIcon }> = [
  { id: 'food', label: 'Thực phẩm', icon: Utensils },
  { id: 'furniture', label: 'Nội thất', icon: Armchair },
  { id: 'clothes', label: 'Quần áo', icon: Shirt },
];

const storeItems: StoreItem[] = [
  {
    id: 'coffee',
    category: 'food',
    name: 'Cà phê sáng',
    description: 'Phần thưởng nhỏ sau một ngày chăm chỉ.',
    price: 15,
    icon: Utensils,
  },
  {
    id: 'sweet-cake',
    category: 'food',
    name: 'Bánh ngọt',
    description: 'Dành cho ngày có nhiều ảnh đẹp.',
    price: 20,
    icon: Utensils,
  },
  {
    id: 'dinner',
    category: 'food',
    name: 'Bữa tối',
    description: 'Đổi cá lấy một bữa ăn tử tế.',
    price: 35,
    icon: Utensils,
  },
  {
    id: 'milk-tea',
    category: 'food',
    name: 'Trà sữa',
    description: 'Một ly ngọt nhẹ cho ngày nhiều việc.',
    price: 18,
    icon: Utensils,
  },
  {
    id: 'banh-mi',
    category: 'food',
    name: 'Bánh mì',
    description: 'Nhanh, gọn, đủ vui cho một bữa nhỏ.',
    price: 22,
    icon: Utensils,
  },
  {
    id: 'noodle-bowl',
    category: 'food',
    name: 'Mì nóng',
    description: 'Một tô ấm bụng sau giờ làm.',
    price: 25,
    icon: Utensils,
  },
  {
    id: 'fruit-cup',
    category: 'food',
    name: 'Trái cây',
    description: 'Món nhẹ để bù năng lượng.',
    price: 28,
    icon: Utensils,
  },
  {
    id: 'ice-cream',
    category: 'food',
    name: 'Kem dâu',
    description: 'Phần thưởng mát lạnh cho ảnh đẹp.',
    price: 30,
    icon: Utensils,
  },
  {
    id: 'fried-chicken',
    category: 'food',
    name: 'Gà rán',
    description: 'Đổi cá lấy một món giòn vui.',
    price: 38,
    icon: Utensils,
  },
  {
    id: 'pizza-slice',
    category: 'food',
    name: 'Pizza nhỏ',
    description: 'Một lát vui vẻ cho cuối ngày.',
    price: 42,
    icon: Utensils,
  },
  {
    id: 'sushi-set',
    category: 'food',
    name: 'Sushi set',
    description: 'Món đẹp mắt cho ngày nhiều cá.',
    price: 48,
    icon: Utensils,
  },
  {
    id: 'hotpot-mini',
    category: 'food',
    name: 'Lẩu mini',
    description: 'Một phần lớn hơn cho buổi tối đặc biệt.',
    price: 55,
    icon: Utensils,
  },
  {
    id: 'steak-plate',
    category: 'food',
    name: 'Bít tết',
    description: 'Phần thưởng cao cấp sau chuỗi ngày chăm.',
    price: 68,
    icon: Utensils,
  },
  {
    id: 'seafood-pot',
    category: 'food',
    name: 'Hải sản',
    description: 'Món lớn dành cho kho cá thật dày.',
    price: 80,
    icon: Utensils,
  },
  {
    id: 'lamp',
    category: 'furniture',
    name: 'Đèn bàn',
    description: 'Một góc phòng sáng hơn.',
    price: 25,
    icon: Armchair,
  },
  {
    id: 'chair',
    category: 'furniture',
    name: 'Ghế đọc sách',
    description: 'Cho những buổi tối yên tĩnh.',
    price: 45,
    icon: Armchair,
  },
  {
    id: 'bookshelf',
    category: 'furniture',
    name: 'Kệ nhỏ',
    description: 'Nơi để vài món kỷ niệm.',
    price: 60,
    icon: Armchair,
  },
  {
    id: 'plant-pot',
    category: 'furniture',
    name: 'Chậu cây',
    description: 'Một chút xanh cho góc phòng.',
    price: 18,
    icon: Armchair,
  },
  {
    id: 'floor-mat',
    category: 'furniture',
    name: 'Thảm sàn',
    description: 'Làm căn phòng mềm và ấm hơn.',
    price: 28,
    icon: Armchair,
  },
  {
    id: 'wall-clock',
    category: 'furniture',
    name: 'Đồng hồ treo tường',
    description: 'Một điểm nhấn nhỏ trên tường.',
    price: 32,
    icon: Armchair,
  },
  {
    id: 'bedside-table',
    category: 'furniture',
    name: 'Tủ đầu giường',
    description: 'Chỗ để đèn, sách và vài món nhỏ.',
    price: 38,
    icon: Armchair,
  },
  {
    id: 'round-table',
    category: 'furniture',
    name: 'Bàn tròn',
    description: 'Một góc ngồi uống nước đơn giản.',
    price: 48,
    icon: Armchair,
  },
  {
    id: 'sofa-small',
    category: 'furniture',
    name: 'Sofa nhỏ',
    description: 'Một chỗ ngồi thoải mái hơn.',
    price: 72,
    icon: Armchair,
  },
  {
    id: 'standing-lamp',
    category: 'furniture',
    name: 'Đèn đứng',
    description: 'Ánh sáng dịu cho buổi tối.',
    price: 78,
    icon: Armchair,
  },
  {
    id: 'wardrobe',
    category: 'furniture',
    name: 'Tủ quần áo',
    description: 'Món lớn giúp phòng gọn hơn.',
    price: 90,
    icon: Armchair,
  },
  {
    id: 'study-desk',
    category: 'furniture',
    name: 'Bàn học',
    description: 'Một góc làm việc riêng.',
    price: 96,
    icon: Armchair,
  },
  {
    id: 'vanity-table',
    category: 'furniture',
    name: 'Bàn trang điểm',
    description: 'Một góc chăm sóc bản thân.',
    price: 105,
    icon: Armchair,
  },
  {
    id: 'double-bed',
    category: 'furniture',
    name: 'Giường đôi',
    description: 'Món trung tâm cho căn phòng mơ ước.',
    price: 130,
    icon: Armchair,
  },
  {
    id: 'window-curtain',
    category: 'furniture',
    name: 'Rèm cửa',
    description: 'Làm phòng riêng tư và dịu hơn.',
    price: 52,
    icon: Armchair,
  },
  {
    id: 'cap',
    category: 'clothes',
    name: 'Mũ đơn giản',
    description: 'Một món dễ mua, dễ dùng.',
    price: 20,
    icon: Shirt,
  },
  {
    id: 'shirt',
    category: 'clothes',
    name: 'Áo mới',
    description: 'Đổi cá cho một bộ đồ mới.',
    price: 40,
    icon: Shirt,
  },
  {
    id: 'jacket',
    category: 'clothes',
    name: 'Áo khoác',
    description: 'Phần thưởng lớn cho chuỗi ngày dài.',
    price: 70,
    icon: Shirt,
  },
];

const badgeRules = [
  {
    id: 'first',
    label: 'Mở màn',
    icon: Camera,
    test: (stats: BaseStats) => stats.totalPhotos >= 1,
  },
  {
    id: 'busy-day',
    label: 'Ngày nhiều ảnh',
    icon: Sparkles,
    test: (stats: BaseStats) => stats.todayPhotos >= 3,
  },
  {
    id: 'collector',
    label: 'Bộ sưu tập 7',
    icon: Award,
    test: (stats: BaseStats) => stats.totalPhotos >= 7,
  },
  {
    id: 'hundred',
    label: '100 cá kiếm được',
    icon: Trophy,
    test: (stats: BaseStats) => stats.earnedPoints >= 100,
  },
  {
    id: 'streak',
    label: 'Chuỗi 3 ngày',
    icon: Flame,
    test: (stats: BaseStats) => stats.streakDays >= 3,
  },
];

function App() {
  const [state, setState] = useState<ScoreState>(() => loadState());
  const [driveConfig, setDriveConfig] = useState<DriveConfig>(() => loadDriveConfig());
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [driveStatus, setDriveStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>(
    'idle',
  );
  const [driveError, setDriveError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<PersonId | null>(null);
  const [isEditingNames, setIsEditingNames] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<StoreCategory>('food');
  const [currentView, setCurrentView] = useState<AppView>('score');
  const [draggingPlacementId, setDraggingPlacementId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem(DRIVE_CONFIG_KEY, JSON.stringify(driveConfig));
    setAccessToken(null);
    setDriveStatus('idle');
    setDriveError(null);
  }, [driveConfig]);

  const statsByPerson = useMemo(() => {
    return state.people.reduce<Record<PersonId, PersonStats>>(
      (acc, person) => {
        const entries = state.entries.filter((entry) => entry.personId === person.id);
        const purchases = state.purchases.filter((purchase) => purchase.personId === person.id);
        const stats = getStats(entries, purchases);
        acc[person.id] = {
          ...stats,
          badges: badgeRules.filter((badge) => badge.test(stats)).map((badge) => badge.id),
        };
        return acc;
      },
      { person_a: emptyStats(), person_b: emptyStats() },
    );
  }, [state.entries, state.people, state.purchases]);

  const leader = useMemo(() => {
    const [first, second] = state.people;
    const firstPoints = statsByPerson[first.id].balancePoints;
    const secondPoints = statsByPerson[second.id].balancePoints;

    if (firstPoints === secondPoints) {
      return null;
    }

    return firstPoints > secondPoints ? first : second;
  }, [state.people, statsByPerson]);

  const driveConfigured = Boolean(driveConfig.clientId.trim() && driveConfig.folderId.trim());
  const totalEarned = state.entries.length * FISH_PER_PHOTO;
  const totalSpent = state.purchases.reduce((sum, purchase) => sum + purchase.price, 0);
  const furniturePurchases = state.purchases.filter((purchase) => purchase.category === 'furniture');

  function showMessage(nextMessage: string, timeout = 1800) {
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(null), timeout);
  }

  async function connectGoogleDrive() {
    if (!driveConfigured) {
      showMessage('Cần nhập Google Client ID và Drive Folder ID.');
      return;
    }

    setDriveStatus('connecting');
    setDriveError(null);

    try {
      await loadGoogleIdentityScript();

      const tokenClient = window.google?.accounts.oauth2.initTokenClient({
        client_id: driveConfig.clientId.trim(),
        scope: DRIVE_SCOPE,
        callback: (response) => {
          if (response.error || !response.access_token) {
            setDriveStatus('error');
            setDriveError(response.error_description || response.error || 'Không lấy được Google token.');
            return;
          }

          setAccessToken(response.access_token);
          setDriveStatus('connected');
          setDriveError(null);
          showMessage('Đã kết nối Google Drive.');
        },
      });

      if (!tokenClient) {
        throw new Error('Không tải được Google Identity Services.');
      }

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (error) {
      setDriveStatus('error');
      setDriveError(error instanceof Error ? error.message : 'Không kết nối được Google Drive.');
    }
  }

  function updateDriveConfig(field: keyof DriveConfig, value: string) {
    setDriveConfig((current) => ({ ...current, [field]: value.trim() }));
  }

  function updatePersonName(personId: PersonId, value: string) {
    setState((current) => ({
      ...current,
      people: current.people.map((person) =>
        person.id === personId ? { ...person, name: value } : person,
      ),
    }));
  }

  async function handleFiles(personId: PersonId, files: FileList | File[]) {
    if (!accessToken) {
      showMessage('Kết nối Google Drive trước khi thả ảnh.');
      return;
    }

    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      showMessage('Chỉ nhận file ảnh.');
      return;
    }

    const entries: PhotoEntry[] = [];
    let failedUploads = 0;

    for (const file of imageFiles) {
      try {
        const uploaded = await uploadFileToDrive(file, accessToken, driveConfig.folderId.trim());
        entries.push({
          id: crypto.randomUUID(),
          personId,
          name: file.name,
          dataUrl: await createPreviewDataUrl(file),
          points: FISH_PER_PHOTO,
          createdAt: new Date().toISOString(),
          driveFileId: uploaded.id,
          driveViewLink: uploaded.webViewLink,
          driveThumbnailLink: uploaded.thumbnailLink,
        });
      } catch (error) {
        failedUploads += 1;

        if (error instanceof Error && error.message.includes('401')) {
          setAccessToken(null);
          setDriveStatus('idle');
        }
      }
    }

    if (entries.length === 0) {
      showMessage('Upload Drive thất bại. Kiểm tra quyền folder hoặc kết nối lại Google Drive.', 2800);
      return;
    }

    setState((current) => ({ ...current, entries: [...entries, ...current.entries] }));
    showMessage(
      failedUploads > 0
        ? `Đã upload ${entries.length} ảnh, lỗi ${failedUploads} ảnh.`
        : `Đã upload Drive và cộng ${entries.length * FISH_PER_PHOTO} cá.`,
      2400,
    );
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, personId: PersonId) {
    event.preventDefault();
    setDraggingId(null);
    void handleFiles(personId, event.dataTransfer.files);
  }

  function handlePick(event: ChangeEvent<HTMLInputElement>, personId: PersonId) {
    if (!event.target.files) {
      return;
    }

    void handleFiles(personId, event.target.files);
    event.target.value = '';
  }

  function buyItem(personId: PersonId, item: StoreItem) {
    const person = state.people.find((candidate) => candidate.id === personId);
    const balance = statsByPerson[personId].balancePoints;

    if (!person) {
      return;
    }

    if (balance < item.price) {
      showMessage(`${person.name} chưa đủ cá để mua ${item.name}.`);
      return;
    }

    setState((current) => ({
      ...current,
      purchases: [
        {
          id: crypto.randomUUID(),
          personId,
          itemId: item.id,
          itemName: item.name,
          category: item.category,
          price: item.price,
          purchasedAt: new Date().toISOString(),
        },
        ...current.purchases,
      ],
    }));
    showMessage(
      item.category === 'furniture'
        ? `${person.name} đã mua ${item.name}. Món này đã vào kho chung.`
        : `${person.name} đã mua ${item.name} (-${item.price} cá).`,
      2200,
    );
  }

  function placeFurniture(purchase: PurchaseEntry, decoratorId: PersonId) {
    if (purchase.category !== 'furniture') {
      return;
    }

    if (state.roomPlacements.some((placement) => placement.purchaseId === purchase.id)) {
      showMessage('Món này đã có trong phòng.');
      return;
    }

    const decorator = state.people.find((person) => person.id === decoratorId);

    setState((current) => {
      if (current.roomPlacements.some((placement) => placement.purchaseId === purchase.id)) {
        return current;
      }

      const offset = current.roomPlacements.length % 5;

      return {
        ...current,
        roomPlacements: [
          ...current.roomPlacements,
          {
            id: crypto.randomUUID(),
            purchaseId: purchase.id,
            itemId: purchase.itemId,
            itemName: purchase.itemName,
            personId: decoratorId,
            xRatio: 0.24 + offset * 0.13,
            yRatio: 0.62 + (offset % 2) * 0.1,
            zIndex: current.roomPlacements.length + 1,
          },
        ],
      };
    });

    showMessage(`${decorator?.name ?? 'Người chơi'} đã đặt ${purchase.itemName} vào phòng.`, 1800);
  }

  function moveFurniturePlacement(placementId: string, xRatio: number, yRatio: number) {
    setState((current) => ({
      ...current,
      roomPlacements: current.roomPlacements.map((placement) =>
        placement.id === placementId
          ? {
              ...placement,
              xRatio: clampRatio(xRatio),
              yRatio: clampRatio(yRatio),
              zIndex: Math.max(...current.roomPlacements.map((item) => item.zIndex), 0) + 1,
            }
          : placement,
      ),
    }));
  }

  function removeFurniturePlacement(placementId: string) {
    setState((current) => ({
      ...current,
      roomPlacements: current.roomPlacements.filter((placement) => placement.id !== placementId),
    }));
  }

  function deleteEntry(entryId: string) {
    const entry = state.entries.find((candidate) => candidate.id === entryId);

    if (!entry) {
      return;
    }

    const remainingEntries = state.entries.filter((candidate) => candidate.id !== entryId);
    const remainingEarned =
      remainingEntries.filter((candidate) => candidate.personId === entry.personId).length *
      FISH_PER_PHOTO;
    const spent = state.purchases
      .filter((purchase) => purchase.personId === entry.personId)
      .reduce((sum, purchase) => sum + purchase.price, 0);

    if (remainingEarned < spent) {
      showMessage('Không thể xóa ảnh vì cá còn lại thấp hơn cá đã mua hàng.', 2600);
      return;
    }

    setState((current) => ({
      ...current,
      entries: current.entries.filter((candidate) => candidate.id !== entryId),
    }));
  }

  function resetAll() {
    if (!window.confirm('Xóa toàn bộ ảnh, cá và vật phẩm đã mua?')) {
      return;
    }

    setState(defaultState);
  }

  return (
    <main className="score-app-shell">
      <header className="score-hero">
        <div>
          <p className="eyebrow">Photo Score</p>
          <h1>Thả ảnh, kiếm cá, mua đồ.</h1>
        </div>
        <div className="score-actions">
          <div className="fixed-points-pill">
            <Camera aria-hidden="true" />
            5 cá / ảnh
          </div>
          <button className="ghost-button" onClick={() => setIsEditingNames((value) => !value)}>
            <Pencil aria-hidden="true" />
            Tên
          </button>
          <button className="ghost-button danger" onClick={resetAll}>
            <RotateCcw aria-hidden="true" />
            Đặt lại
          </button>
        </div>
      </header>

      <nav className="view-tabs" aria-label="Chuyển trang">
        <button
          className={currentView === 'score' ? 'active' : ''}
          onClick={() => setCurrentView('score')}
          type="button"
        >
          <ImagePlus aria-hidden="true" />
          Đăng ảnh
        </button>
        <button
          className={currentView === 'room' ? 'active' : ''}
          onClick={() => setCurrentView('room')}
          type="button"
        >
          <Home aria-hidden="true" />
          Phòng
        </button>
      </nav>

      <section className="summary-band">
        <div>
          <span>Tổng ảnh</span>
          <strong>{state.entries.length}</strong>
        </div>
        <div>
          <span>Cá khả dụng</span>
          <strong>{totalEarned - totalSpent}</strong>
        </div>
        <div>
          <span>Dẫn trước</span>
          <strong>{leader?.name ?? 'Hòa'}</strong>
        </div>
      </section>

      {currentView === 'score' ? (
        <>
          <section className="drive-panel">
            <div className="drive-heading">
              <Settings aria-hidden="true" />
              <div>
                <h2>Google Drive chung</h2>
                <p>Ảnh upload lên folder Drive này trước khi được cộng 5 cá.</p>
              </div>
            </div>

            <div className="drive-form">
              <label>
                <span>Google OAuth Client ID</span>
                <input
                  value={driveConfig.clientId}
                  onChange={(event) => updateDriveConfig('clientId', event.target.value)}
                  placeholder="xxxxx.apps.googleusercontent.com"
                />
              </label>
              <label>
                <span>Drive Folder ID</span>
                <input
                  value={driveConfig.folderId}
                  onChange={(event) => updateDriveConfig('folderId', event.target.value)}
                  placeholder="ID folder Drive chung"
                />
              </label>
              <button className="drive-connect-button" onClick={() => void connectGoogleDrive()}>
                {driveStatus === 'connected' ? (
                  <CheckCircle2 aria-hidden="true" />
                ) : (
                  <Upload aria-hidden="true" />
                )}
                {driveStatus === 'connecting'
                  ? 'Đang kết nối'
                  : driveStatus === 'connected'
                    ? 'Đã kết nối'
                    : 'Kết nối Drive'}
              </button>
            </div>

            {driveError ? <p className="drive-error">{driveError}</p> : null}
          </section>

          <section className="person-grid">
            {state.people.map((person) => (
              <PersonScorePanel
                key={person.id}
                person={person}
                stats={statsByPerson[person.id]}
                entries={state.entries.filter((entry) => entry.personId === person.id)}
                purchases={state.purchases.filter((purchase) => purchase.personId === person.id)}
                dragging={draggingId === person.id}
                editingName={isEditingNames}
                onNameChange={(value) => updatePersonName(person.id, value)}
                onDragEnter={() => setDraggingId(person.id)}
                onDragLeave={() => setDraggingId(null)}
                onDrop={(event) => handleDrop(event, person.id)}
                onPick={(event) => handlePick(event, person.id)}
                onDelete={deleteEntry}
              />
            ))}
          </section>

          <StorePanel
            people={state.people}
            statsByPerson={statsByPerson}
            selectedCategory={selectedCategory}
            purchases={state.purchases}
            onCategoryChange={setSelectedCategory}
            onBuy={buyItem}
          />
        </>
      ) : (
        <RoomPanel
          people={state.people}
          purchases={furniturePurchases}
          placements={state.roomPlacements}
          draggingPlacementId={draggingPlacementId}
          onPlace={placeFurniture}
          onMove={moveFurniturePlacement}
          onRemove={removeFurniturePlacement}
          onDragChange={setDraggingPlacementId}
        />
      )}

      {message ? <div className="toast-message">{message}</div> : null}
    </main>
  );
}

interface RoomPanelProps {
  people: Person[];
  purchases: PurchaseEntry[];
  placements: RoomPlacement[];
  draggingPlacementId: string | null;
  onPlace: (purchase: PurchaseEntry, decoratorId: PersonId) => void;
  onMove: (placementId: string, xRatio: number, yRatio: number) => void;
  onRemove: (placementId: string) => void;
  onDragChange: (placementId: string | null) => void;
}

function RoomPanel({
  people,
  purchases,
  placements,
  draggingPlacementId,
  onPlace,
  onMove,
  onRemove,
  onDragChange,
}: RoomPanelProps) {
  const usedPurchaseIds = new Set(placements.map((placement) => placement.purchaseId));
  const inventory = purchases.filter((purchase) => !usedPurchaseIds.has(purchase.id));

  function moveFromPointer(
    event: PointerEvent<HTMLDivElement>,
    placementId: string,
    stage: HTMLElement | null,
  ) {
    if (!stage) {
      return;
    }

    const rect = stage.getBoundingClientRect();
    onMove(placementId, (event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
  }

  function handlePlacementPointerDown(event: PointerEvent<HTMLDivElement>, placementId: string) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    onDragChange(placementId);
    moveFromPointer(event, placementId, event.currentTarget.parentElement);
  }

  function handlePlacementPointerMove(event: PointerEvent<HTMLDivElement>, placementId: string) {
    if (draggingPlacementId !== placementId) {
      return;
    }

    moveFromPointer(event, placementId, event.currentTarget.parentElement);
  }

  function handlePlacementPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    onDragChange(null);
  }

  function getPersonName(personId: PersonId) {
    return people.find((person) => person.id === personId)?.name ?? 'Người chơi';
  }

  return (
    <section className="room-panel">
      <header className="room-header">
        <div>
          <p className="eyebrow">Phòng</p>
          <h2>Phòng trang trí nội thất.</h2>
        </div>
        <span>{placements.length} món đang đặt từ kho chung</span>
      </header>

      <div className="room-layout">
        <div className="room-stage" aria-label="Phòng trang trí">
          <div className="room-wall">
            <div className="room-window" />
            <div className="room-shelf" />
          </div>
          <div className="room-floor" />

          {placements.length === 0 ? (
            <div className="room-empty">
              <Armchair aria-hidden="true" />
              <span>Chưa có nội thất trong phòng.</span>
            </div>
          ) : null}

          {placements.map((placement) => (
            <div
              className={
                draggingPlacementId === placement.id ? 'room-object dragging' : 'room-object'
              }
              key={placement.id}
              onPointerDown={(event) => handlePlacementPointerDown(event, placement.id)}
              onPointerMove={(event) => handlePlacementPointerMove(event, placement.id)}
              onPointerUp={handlePlacementPointerUp}
              onPointerCancel={handlePlacementPointerUp}
              role="button"
              style={
                {
                  left: `${placement.xRatio * 100}%`,
                  top: `${placement.yRatio * 100}%`,
                  zIndex: placement.zIndex,
                  '--owner-color':
                    people.find((person) => person.id === placement.personId)?.color ?? '#2f6d5f',
                } as CSSProperties
              }
              tabIndex={0}
              title={`${placement.itemName} - ${getPersonName(placement.personId)}`}
            >
              <Armchair aria-hidden="true" />
              <div>
                <strong>{placement.itemName}</strong>
                <span>Đặt bởi {getPersonName(placement.personId)}</span>
              </div>
              <button
                className="room-remove-button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(placement.id);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                title="Gỡ khỏi phòng"
                type="button"
              >
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>

        <aside className="room-inventory">
          <header>
            <h3>Kho nội thất chung</h3>
            <span>{inventory.length} món chưa đặt</span>
          </header>

          {inventory.length === 0 ? (
            <p className="empty-text">Chưa có nội thất trong kho.</p>
          ) : (
            <div className="inventory-list">
              {inventory.map((purchase) => (
                <article className="inventory-item" key={purchase.id}>
                  <Armchair aria-hidden="true" />
                  <div>
                    <h4>{purchase.itemName}</h4>
                    <p>Mua bởi {getPersonName(purchase.personId)}</p>
                  </div>
                  <div className="inventory-actions">
                    {people.map((person) => (
                      <button
                        key={person.id}
                        onClick={() => onPlace(purchase, person.id)}
                        type="button"
                      >
                        {person.name} đặt
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

interface PersonScorePanelProps {
  person: Person;
  stats: PersonStats;
  entries: PhotoEntry[];
  purchases: PurchaseEntry[];
  dragging: boolean;
  editingName: boolean;
  onNameChange: (value: string) => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onPick: (event: ChangeEvent<HTMLInputElement>) => void;
  onDelete: (entryId: string) => void;
}

function PersonScorePanel({
  person,
  stats,
  entries,
  purchases,
  dragging,
  editingName,
  onNameChange,
  onDragEnter,
  onDragLeave,
  onDrop,
  onPick,
  onDelete,
}: PersonScorePanelProps) {
  return (
    <article className="person-score-panel" style={{ '--accent': person.color } as CSSProperties}>
      <header className="person-score-header">
        <div>
          {editingName ? (
            <input
              className="name-input"
              value={person.name}
              onChange={(event) => onNameChange(event.target.value)}
              aria-label="Tên người chơi"
            />
          ) : (
            <h2>{person.name}</h2>
          )}
          <p>{stats.todayPhotos} ảnh hôm nay</p>
        </div>
        <div className="score-number">
          <strong>{stats.balancePoints}</strong>
          <span>cá khả dụng</span>
        </div>
      </header>

      <div className="metric-row">
        <Metric icon={ImagePlus} label="Kiếm được" value={stats.earnedPoints} />
        <Metric icon={ShoppingBag} label="Đã tiêu" value={stats.spentPoints} />
        <Metric icon={Medal} label="Huy hiệu" value={stats.badges.length} />
      </div>

      <div
        className={dragging ? 'drop-zone dragging' : 'drop-zone'}
        onDragOver={(event) => event.preventDefault()}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <Upload aria-hidden="true" />
        <span>Kéo ảnh vào đây</span>
        <label className="upload-button">
          <ImagePlus aria-hidden="true" />
          Chọn ảnh
          <input type="file" accept="image/*" multiple onChange={onPick} />
        </label>
      </div>

      <div className="badge-row">
        {badgeRules.map((badge) => {
          const Icon = badge.icon;
          const unlocked = stats.badges.includes(badge.id);
          return (
            <span className={unlocked ? 'badge unlocked' : 'badge'} key={badge.id}>
              <Icon aria-hidden="true" />
              {badge.label}
            </span>
          );
        })}
      </div>

      <div className="purchase-summary">
        <h3>Vật phẩm đã mua</h3>
        {purchases.length === 0 ? (
          <p className="empty-text">Chưa mua vật phẩm nào.</p>
        ) : (
          <div className="purchase-list">
            {purchases.slice(0, 5).map((purchase) => (
              <span key={purchase.id}>
                {purchase.itemName}
                <strong>-{purchase.price}</strong>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="photo-strip">
        {entries.length === 0 ? (
          <p className="empty-text">Chưa có ảnh.</p>
        ) : (
          entries.slice(0, 12).map((entry) => (
            <figure key={entry.id} className="photo-tile">
              <img src={entry.dataUrl} alt={entry.name} />
              <figcaption>
                {entry.driveViewLink ? (
                  <a href={entry.driveViewLink} target="_blank" rel="noreferrer">
                    +{FISH_PER_PHOTO}
                  </a>
                ) : (
                  <span>+{FISH_PER_PHOTO}</span>
                )}
                <button onClick={() => onDelete(entry.id)} title="Xóa ảnh">
                  <Trash2 aria-hidden="true" />
                </button>
              </figcaption>
            </figure>
          ))
        )}
      </div>
    </article>
  );
}

interface StorePanelProps {
  people: Person[];
  statsByPerson: Record<PersonId, PersonStats>;
  selectedCategory: StoreCategory;
  purchases: PurchaseEntry[];
  onCategoryChange: (category: StoreCategory) => void;
  onBuy: (personId: PersonId, item: StoreItem) => void;
}

function StorePanel({
  people,
  statsByPerson,
  selectedCategory,
  purchases,
  onCategoryChange,
  onBuy,
}: StorePanelProps) {
  const visibleItems = storeItems.filter((item) => item.category === selectedCategory);

  return (
    <section className="store-panel">
      <header className="store-header">
        <div>
          <p className="eyebrow">Cửa hàng</p>
          <h2>Dùng cá để mua vật phẩm.</h2>
        </div>
        <span>{purchases.length} lượt mua</span>
      </header>

      <div className="store-tabs" role="tablist" aria-label="Danh mục cửa hàng">
        {storeCategories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              className={category.id === selectedCategory ? 'active' : ''}
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              type="button"
            >
              <Icon aria-hidden="true" />
              {category.label}
            </button>
          );
        })}
      </div>

      <div className="store-grid">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <article className="store-item" key={item.id}>
              <div className="store-item-main">
                <Icon aria-hidden="true" />
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                </div>
                <strong>{item.price} ca</strong>
              </div>
              <div className="store-buy-row">
                {people.map((person) => {
                  const affordable = statsByPerson[person.id].balancePoints >= item.price;
                  return (
                    <button
                      key={person.id}
                      disabled={!affordable}
                      onClick={() => onBuy(person.id, item)}
                      type="button"
                    >
                      Mua cho {person.name}
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="metric">
      <Icon aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function loadState(): ScoreState {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return defaultState;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<ScoreState> & { pointsPerPhoto?: number };
    const people =
      parsed.people?.length === 2
        ? parsed.people.map((person, index) => {
            const fallback = defaultState.people[index];
            return {
              ...fallback,
              ...person,
              name: normalizePersonName(
                typeof person.name === 'string' ? person.name : fallback.name,
                index,
              ),
            };
          })
        : defaultState.people;
    const purchases = Array.isArray(parsed.purchases)
      ? parsed.purchases.map((purchase) => ({
          ...purchase,
          itemName: getStoreItemName(purchase.itemId, purchase.itemName),
        }))
      : [];
    const roomPlacements = Array.isArray(parsed.roomPlacements)
      ? parsed.roomPlacements.map((placement) => ({
          ...placement,
          itemName: getStoreItemName(placement.itemId, placement.itemName),
        }))
      : [];

    return {
      people,
      entries: Array.isArray(parsed.entries)
        ? parsed.entries.map((entry) => ({ ...entry, points: FISH_PER_PHOTO }))
        : [],
      purchases,
      roomPlacements,
    };
  } catch {
    return defaultState;
  }
}

function normalizePersonName(value: string, index: number) {
  const trimmed = value.trim();

  if (
    (index === 0 && (trimmed === 'Ban' || trimmed === 'Bạn')) ||
    (index === 1 && (trimmed === 'Nguoi ay' || trimmed === 'Người ấy'))
  ) {
    return defaultState.people[index].name;
  }

  return trimmed || defaultState.people[index].name;
}

function getStoreItemName(itemId: string, fallback: string) {
  return storeItems.find((item) => item.id === itemId)?.name ?? fallback;
}

function clampRatio(value: number) {
  if (!Number.isFinite(value)) {
    return 0.5;
  }

  return Math.min(0.96, Math.max(0.04, value));
}

function loadDriveConfig(): DriveConfig {
  const saved = localStorage.getItem(DRIVE_CONFIG_KEY);

  if (!saved) {
    return { clientId: '', folderId: '' };
  }

  try {
    const parsed = JSON.parse(saved) as Partial<DriveConfig>;
    return {
      clientId: parsed.clientId ?? '',
      folderId: parsed.folderId ?? '',
    };
  } catch {
    return { clientId: '', folderId: '' };
  }
}

function getStats(entries: PhotoEntry[], purchases: PurchaseEntry[]): BaseStats {
  const todayKey = toDateKey(new Date());
  const activeDays = new Set(entries.map((entry) => toDateKey(new Date(entry.createdAt))));
  const earnedPoints = entries.length * FISH_PER_PHOTO;
  const spentPoints = purchases.reduce((sum, purchase) => sum + purchase.price, 0);

  return {
    totalPhotos: entries.length,
    todayPhotos: entries.filter((entry) => toDateKey(new Date(entry.createdAt)) === todayKey).length,
    earnedPoints,
    spentPoints,
    balancePoints: earnedPoints - spentPoints,
    streakDays: getStreakDays(activeDays),
  };
}

function emptyStats(): PersonStats {
  return {
    totalPhotos: 0,
    todayPhotos: 0,
    earnedPoints: 0,
    spentPoints: 0,
    balancePoints: 0,
    streakDays: 0,
    badges: [],
  };
}

function getStreakDays(activeDays: Set<string>) {
  let streak = 0;
  const cursor = new Date();

  while (activeDays.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function loadGoogleIdentityScript() {
  if (window.google?.accounts.oauth2) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_IDENTITY_SCRIPT}"]`,
    );

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Không tải được Google script.')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_IDENTITY_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Không tải được Google script.'));
    document.head.appendChild(script);
  });
}

async function uploadFileToDrive(file: File, accessToken: string, folderId: string) {
  const boundary = `photo_score_${crypto.randomUUID()}`;
  const metadata = {
    name: `${new Date().toISOString().replace(/[:.]/g, '-')}-${file.name}`,
    mimeType: file.type || 'application/octet-stream',
    parents: [folderId],
  };

  const body = new Blob(
    [
      `--${boundary}\r\n`,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify(metadata),
      `\r\n--${boundary}\r\n`,
      `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`,
      file,
      `\r\n--${boundary}--`,
    ],
    { type: `multipart/related; boundary=${boundary}` },
  );

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,thumbnailLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Drive upload failed ${response.status}: ${text}`);
  }

  return (await response.json()) as {
    id: string;
    name: string;
    webViewLink?: string;
    thumbnailLink?: string;
  };
}

async function createPreviewDataUrl(file: File) {
  const imageUrl = await readAsDataUrl(file);
  const image = await loadImage(imageUrl);
  const maxSize = 640;
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  if (!context) {
    return imageUrl;
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.78);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Không đọc được ảnh.'));
    image.src = src;
  });
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default App;

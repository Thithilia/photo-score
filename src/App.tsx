import {
  ChangeEvent,
  CSSProperties,
  DragEvent,
  PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Armchair,
  Award,
  CalendarDays,
  Camera,
  CheckCircle2,
  Cloud,
  Flame,
  Home,
  ImagePlus,
  Medal,
  Pencil,
  RefreshCw,
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
import { StoreItemIllustration } from './itemIllustrations';

type PersonId = 'person_a' | 'person_b';
type StoreCategory = 'food' | 'furniture' | 'clothes';
type AppView = 'score' | 'room';
type SyncStatus = 'idle' | 'loading' | 'saving' | 'synced' | 'error';
type FishTransactionType = 'photo_upload' | 'store_purchase' | 'migration_adjustment';
type PhotoUploadStatus = 'uploading' | 'uploaded' | 'failed';

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
  uploadStatus?: PhotoUploadStatus;
  uploadError?: string;
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

interface FishWallet {
  personId: PersonId;
  balance: number;
  earnedTotal: number;
  spentTotal: number;
  updatedAt: string;
}

interface FishTransaction {
  id: string;
  personId: PersonId;
  type: FishTransactionType;
  amount: number;
  balanceAfter: number;
  note: string;
  createdAt: string;
  entryId?: string;
  purchaseId?: string;
  itemId?: string;
}

interface ScoreState {
  people: Person[];
  entries: PhotoEntry[];
  purchases: PurchaseEntry[];
  roomPlacements: RoomPlacement[];
  wallets: FishWallet[];
  fishTransactions: FishTransaction[];
}

interface DriveConfig {
  clientId: string;
  folderId: string;
}

interface DriveFileMetadata {
  id: string;
  name: string;
  modifiedTime?: string;
}

interface DriveStateFile {
  version: number;
  updatedAt: string;
  state: ScoreState;
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
  expires_in?: number;
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
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';
const DRIVE_STATE_FILE_NAME = 'photo-score-state.json';
const DRIVE_JSON_MIME_TYPE = 'application/json';
const FISH_PER_PHOTO = 5;
const INITIAL_WALLET_DATE = '2026-01-01T00:00:00.000Z';

const defaultPeople: Person[] = [
  { id: 'person_a', name: 'Tôi', color: '#2f6d5f' },
  { id: 'person_b', name: 'Cậu iu', color: '#c96d63' },
];

const defaultState: ScoreState = {
  people: defaultPeople,
  entries: [],
  purchases: [],
  roomPlacements: [],
  wallets: defaultPeople.map((person) => createEmptyWallet(person.id)),
  fishTransactions: [],
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
    price: 1,
    icon: Utensils,
  },
  {
    id: 'sweet-cake',
    category: 'food',
    name: 'Bánh ngọt',
    description: 'Dành cho ngày có nhiều ảnh đẹp.',
    price: 2,
    icon: Utensils,
  },
  {
    id: 'dinner',
    category: 'food',
    name: 'Bữa tối',
    description: 'Đổi cá lấy một bữa ăn tử tế.',
    price: 6,
    icon: Utensils,
  },
  {
    id: 'milk-tea',
    category: 'food',
    name: 'Trà sữa',
    description: 'Một ly ngọt nhẹ cho ngày nhiều việc.',
    price: 3,
    icon: Utensils,
  },
  {
    id: 'banh-mi',
    category: 'food',
    name: 'Bánh mì',
    description: 'Nhanh, gọn, đủ vui cho một bữa nhỏ.',
    price: 3,
    icon: Utensils,
  },
  {
    id: 'noodle-bowl',
    category: 'food',
    name: 'Mì nóng',
    description: 'Một tô ấm bụng sau giờ làm.',
    price: 4,
    icon: Utensils,
  },
  {
    id: 'fruit-cup',
    category: 'food',
    name: 'Trái cây',
    description: 'Món nhẹ để bù năng lượng.',
    price: 4,
    icon: Utensils,
  },
  {
    id: 'ice-cream',
    category: 'food',
    name: 'Kem dâu',
    description: 'Phần thưởng mát lạnh cho ảnh đẹp.',
    price: 4,
    icon: Utensils,
  },
  {
    id: 'fried-chicken',
    category: 'food',
    name: 'Gà rán',
    description: 'Đổi cá lấy một món giòn vui.',
    price: 7,
    icon: Utensils,
  },
  {
    id: 'pizza-slice',
    category: 'food',
    name: 'Pizza nhỏ',
    description: 'Một lát vui vẻ cho cuối ngày.',
    price: 8,
    icon: Utensils,
  },
  {
    id: 'sushi-set',
    category: 'food',
    name: 'Sushi set',
    description: 'Món đẹp mắt cho ngày nhiều cá.',
    price: 10,
    icon: Utensils,
  },
  {
    id: 'hotpot-mini',
    category: 'food',
    name: 'Lẩu mini',
    description: 'Một phần lớn hơn cho buổi tối đặc biệt.',
    price: 12,
    icon: Utensils,
  },
  {
    id: 'steak-plate',
    category: 'food',
    name: 'Bít tết',
    description: 'Phần thưởng cao cấp sau chuỗi ngày chăm.',
    price: 14,
    icon: Utensils,
  },
  {
    id: 'seafood-pot',
    category: 'food',
    name: 'Hải sản',
    description: 'Món lớn dành cho kho cá thật dày.',
    price: 16,
    icon: Utensils,
  },
  {
    id: 'lamp',
    category: 'furniture',
    name: 'Đèn bàn',
    description: 'Một góc phòng sáng hơn.',
    price: 14,
    icon: Armchair,
  },
  {
    id: 'chair',
    category: 'furniture',
    name: 'Ghế đọc sách',
    description: 'Cho những buổi tối yên tĩnh.',
    price: 25,
    icon: Armchair,
  },
  {
    id: 'bookshelf',
    category: 'furniture',
    name: 'Kệ nhỏ',
    description: 'Nơi để vài món kỷ niệm.',
    price: 36,
    icon: Armchair,
  },
  {
    id: 'plant-pot',
    category: 'furniture',
    name: 'Chậu cây',
    description: 'Một chút xanh cho góc phòng.',
    price: 12,
    icon: Armchair,
  },
  {
    id: 'floor-mat',
    category: 'furniture',
    name: 'Thảm sàn',
    description: 'Làm căn phòng mềm và ấm hơn.',
    price: 15,
    icon: Armchair,
  },
  {
    id: 'wall-clock',
    category: 'furniture',
    name: 'Đồng hồ treo tường',
    description: 'Một điểm nhấn nhỏ trên tường.',
    price: 18,
    icon: Armchair,
  },
  {
    id: 'bedside-table',
    category: 'furniture',
    name: 'Tủ đầu giường',
    description: 'Chỗ để đèn, sách và vài món nhỏ.',
    price: 22,
    icon: Armchair,
  },
  {
    id: 'round-table',
    category: 'furniture',
    name: 'Bàn tròn',
    description: 'Một góc ngồi uống nước đơn giản.',
    price: 30,
    icon: Armchair,
  },
  {
    id: 'sofa-small',
    category: 'furniture',
    name: 'Sofa nhỏ',
    description: 'Một chỗ ngồi thoải mái hơn.',
    price: 45,
    icon: Armchair,
  },
  {
    id: 'standing-lamp',
    category: 'furniture',
    name: 'Đèn đứng',
    description: 'Ánh sáng dịu cho buổi tối.',
    price: 48,
    icon: Armchair,
  },
  {
    id: 'wardrobe',
    category: 'furniture',
    name: 'Tủ quần áo',
    description: 'Món lớn giúp phòng gọn hơn.',
    price: 55,
    icon: Armchair,
  },
  {
    id: 'study-desk',
    category: 'furniture',
    name: 'Bàn học',
    description: 'Một góc làm việc riêng.',
    price: 58,
    icon: Armchair,
  },
  {
    id: 'vanity-table',
    category: 'furniture',
    name: 'Bàn trang điểm',
    description: 'Một góc chăm sóc bản thân.',
    price: 62,
    icon: Armchair,
  },
  {
    id: 'double-bed',
    category: 'furniture',
    name: 'Giường đôi',
    description: 'Món trung tâm cho căn phòng mơ ước.',
    price: 75,
    icon: Armchair,
  },
  {
    id: 'window-curtain',
    category: 'furniture',
    name: 'Rèm cửa',
    description: 'Làm phòng riêng tư và dịu hơn.',
    price: 32,
    icon: Armchair,
  },
  {
    id: 'cap',
    category: 'clothes',
    name: 'Mũ đơn giản',
    description: 'Một món dễ mua, dễ dùng.',
    price: 5,
    icon: Shirt,
  },
  {
    id: 'shirt',
    category: 'clothes',
    name: 'Áo mới',
    description: 'Đổi cá cho một bộ đồ mới.',
    price: 10,
    icon: Shirt,
  },
  {
    id: 'jacket',
    category: 'clothes',
    name: 'Áo khoác',
    description: 'Phần thưởng lớn cho chuỗi ngày dài.',
    price: 18,
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
  const [accessTokenExpiresAt, setAccessTokenExpiresAt] = useState<number | null>(null);
  const [driveStatus, setDriveStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>(
    'idle',
  );
  const [driveError, setDriveError] = useState<string | null>(null);
  const [driveStateFileId, setDriveStateFileId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [hasLoadedDriveState, setHasLoadedDriveState] = useState(false);
  const [draggingId, setDraggingId] = useState<PersonId | null>(null);
  const [isEditingNames, setIsEditingNames] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<StoreCategory>('food');
  const [currentView, setCurrentView] = useState<AppView>('score');
  const [draggingPlacementId, setDraggingPlacementId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const tokenRefreshPromiseRef = useRef<Promise<string> | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem(DRIVE_CONFIG_KEY, JSON.stringify(driveConfig));
    setAccessToken(null);
    setAccessTokenExpiresAt(null);
    setDriveStatus('idle');
    setDriveError(null);
    setDriveStateFileId(null);
    setSyncStatus('idle');
    setSyncError(null);
    setLastSyncedAt(null);
    setHasLoadedDriveState(false);
  }, [driveConfig]);

  useEffect(() => {
    if (!accessToken || !driveStateFileId || !hasLoadedDriveState) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveSharedState(state);
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [accessToken, driveStateFileId, hasLoadedDriveState, state]);

  const statsByPerson = useMemo(() => {
    return state.people.reduce<Record<PersonId, PersonStats>>(
      (acc, person) => {
        const entries = state.entries.filter(
          (entry) => entry.personId === person.id && isUploadedEntry(entry),
        );
        const wallet = getWallet(state.wallets, person.id);
        const stats = getStats(entries, wallet);
        acc[person.id] = {
          ...stats,
          badges: badgeRules.filter((badge) => badge.test(stats)).map((badge) => badge.id),
        };
        return acc;
      },
      { person_a: emptyStats(), person_b: emptyStats() },
    );
  }, [state.entries, state.people, state.wallets]);

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
  const uploadedEntries = state.entries.filter(isUploadedEntry);
  const totalBalance = state.wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const furniturePurchases = state.purchases.filter((purchase) => purchase.category === 'furniture');
  const syncStatusLabel = getSyncStatusLabel(syncStatus);
  const lastSyncedLabel = lastSyncedAt ? formatDateTime(lastSyncedAt) : null;

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
      const token = await requestDriveAccessToken('consent');
      await loadSharedState(token);
    } catch (error) {
      setDriveStatus('error');
      setDriveError(error instanceof Error ? error.message : 'Không kết nối được Google Drive.');
    }
  }

  async function requestDriveAccessToken(prompt: 'consent' | '') {
    if (!driveConfigured) {
      throw new Error('Cần nhập Google Client ID và Drive Folder ID.');
    }

    await loadGoogleIdentityScript();

    return new Promise<string>((resolve, reject) => {
      let settled = false;
      const timeoutId = window.setTimeout(
        () => {
          if (settled) {
            return;
          }

          settled = true;
          reject(
            new Error(
              prompt === ''
                ? 'Không tự làm mới được phiên Google Drive.'
                : 'Không lấy được Google token.',
            ),
          );
        },
        prompt === '' ? 10000 : 90000,
      );

      const tokenClient = window.google?.accounts.oauth2.initTokenClient({
        client_id: driveConfig.clientId.trim(),
        scope: DRIVE_SCOPE,
        callback: (response) => {
          if (settled) {
            return;
          }

          settled = true;
          window.clearTimeout(timeoutId);

          if (response.error || !response.access_token) {
            reject(
              new Error(response.error_description || response.error || 'Không lấy được Google token.'),
            );
            return;
          }

          const expiresInSeconds = response.expires_in ?? 3600;
          setAccessToken(response.access_token);
          setAccessTokenExpiresAt(Date.now() + expiresInSeconds * 1000);
          setDriveStatus('connected');
          setDriveError(null);
          resolve(response.access_token);
        },
      });

      if (!tokenClient) {
        window.clearTimeout(timeoutId);
        settled = true;
        reject(new Error('Không tải được Google Identity Services.'));
        return;
      }

      try {
        tokenClient.requestAccessToken({ prompt });
      } catch (error) {
        window.clearTimeout(timeoutId);
        settled = true;
        reject(error instanceof Error ? error : new Error('Không mở được Google Drive auth.'));
      }
    });
  }

  async function getFreshAccessToken(options: { interactive?: boolean; force?: boolean } = {}) {
    const shouldRefresh =
      options.force ||
      !accessToken ||
      (accessTokenExpiresAt !== null && Date.now() > accessTokenExpiresAt - 120000);

    if (!shouldRefresh && accessToken) {
      return accessToken;
    }

    if (tokenRefreshPromiseRef.current) {
      return tokenRefreshPromiseRef.current;
    }

    const refreshPromise = requestDriveAccessToken(options.interactive ? 'consent' : '').finally(() => {
      tokenRefreshPromiseRef.current = null;
    });

    tokenRefreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }

  async function loadSharedState(token: string) {
    const folderId = driveConfig.folderId.trim();

    if (!folderId) {
      showMessage('Cần nhập Drive Folder ID.');
      return;
    }

    setSyncStatus('loading');
    setSyncError(null);

    try {
      const existingFile = await findDriveStateFile(token, folderId);
      const now = new Date().toISOString();

      if (existingFile) {
        const sharedState = await downloadDriveStateFile(token, existingFile.id);

        setDriveStateFileId(existingFile.id);
        setState(sharedState);
        setHasLoadedDriveState(true);
        setLastSyncedAt(existingFile.modifiedTime ?? now);
        setSyncStatus('synced');
        showMessage('Đã tải dữ liệu chung từ Google Drive.', 2200);
        return;
      }

      const createdFile = await createDriveStateFile(token, folderId, state);
      setDriveStateFileId(createdFile.id);
      setHasLoadedDriveState(true);
      setLastSyncedAt(createdFile.modifiedTime ?? now);
      setSyncStatus('synced');
      showMessage('Đã tạo file dữ liệu chung trên Google Drive.', 2600);
    } catch (error) {
      const nextError = getErrorMessage(error, 'Không tải được dữ liệu chung từ Drive.');
      setSyncStatus('error');
      setSyncError(nextError);

      if (isAuthError(nextError)) {
        setAccessToken(null);
        setAccessTokenExpiresAt(null);
        setDriveStatus('idle');
      }

      showMessage('Không đồng bộ được dữ liệu chung. Kiểm tra quyền folder hoặc kết nối lại Drive.', 3200);
    }
  }

  async function saveSharedState(nextState: ScoreState) {
    if (!driveStateFileId) {
      return;
    }

    setSyncStatus('saving');
    setSyncError(null);

    try {
      const token = await getFreshAccessToken();
      const savedFile = await updateDriveStateFile(token, driveStateFileId, nextState);
      setLastSyncedAt(savedFile.modifiedTime ?? new Date().toISOString());
      setSyncStatus('synced');
    } catch (error) {
      const nextError = getErrorMessage(error, 'Không lưu được dữ liệu chung lên Drive.');

      if (isAuthError(nextError)) {
        try {
          const token = await getFreshAccessToken({ force: true });
          const savedFile = await updateDriveStateFile(token, driveStateFileId, nextState);
          setLastSyncedAt(savedFile.modifiedTime ?? new Date().toISOString());
          setSyncStatus('synced');
          return;
        } catch (retryError) {
          const retryMessage = getErrorMessage(retryError, nextError);
          setAccessToken(null);
          setAccessTokenExpiresAt(null);
          setDriveStatus('idle');
          setSyncStatus('error');
          setSyncError(retryMessage);
          showMessage('Phiên Google Drive đã hết hạn. Bấm Kết nối Drive để lưu tiếp.', 3600);
          return;
        }
      }

      setSyncStatus('error');
      setSyncError(nextError);

      showMessage('Không lưu được dữ liệu chung lên Drive.', 2600);
    }
  }

  async function refreshSharedState() {
    if (!driveConfigured) {
      showMessage('Cần nhập Google Client ID và Drive Folder ID.');
      return;
    }

    try {
      const token = await getFreshAccessToken({ interactive: !accessToken });
      await loadSharedState(token);
    } catch (error) {
      const nextError = getErrorMessage(error, 'Không tải được dữ liệu chung.');
      setDriveStatus('idle');
      setDriveError(nextError);
      showMessage('Không tự kết nối lại được Google Drive. Bấm Kết nối Drive để cấp quyền lại.', 3600);
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
    if (!driveConfigured) {
      showMessage('Cần nhập Google Client ID và Drive Folder ID.');
      return;
    }

    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      showMessage('Chỉ nhận file ảnh.');
      return;
    }

    const pendingEntries: PhotoEntry[] = imageFiles.map((file) => ({
      id: crypto.randomUUID(),
      personId,
      name: file.name,
      dataUrl: '',
      points: 0,
      createdAt: new Date().toISOString(),
      uploadStatus: 'uploading',
    }));

    setState((current) => ({
      ...current,
      entries: [...pendingEntries, ...current.entries],
    }));
    showMessage(`Đang upload ${pendingEntries.length} ảnh lên Drive...`, 1800);
    const uploadTokenPromise = getFreshAccessToken({ interactive: !accessToken });

    const uploadResults = await Promise.allSettled(
      pendingEntries.map(async (entry, index) => {
        const file = imageFiles[index];
        const previewPromise = createPreviewDataUrl(file).catch(() => '');

        void previewPromise.then((previewDataUrl) => {
          if (previewDataUrl) {
            setState((current) => updateEntryPreview(current, entry.id, previewDataUrl));
          }
        });

        try {
          const token = await uploadTokenPromise;
          const [uploaded, previewDataUrl] = await Promise.all([
            uploadFileToDrive(file, token, driveConfig.folderId.trim()),
            previewPromise,
          ]);

          setState((current) => {
            if (!current.entries.some((candidate) => candidate.id === entry.id)) {
              return current;
            }

            const uploadedAt = new Date().toISOString();
            const nextState = {
              ...current,
              entries: current.entries.map((candidate) =>
                candidate.id === entry.id
                  ? {
                      ...candidate,
                      dataUrl: previewDataUrl || candidate.dataUrl,
                      points: FISH_PER_PHOTO,
                      createdAt: uploadedAt,
                      driveFileId: uploaded.id,
                      driveViewLink: uploaded.webViewLink,
                      driveThumbnailLink: uploaded.thumbnailLink,
                      uploadStatus: 'uploaded' as PhotoUploadStatus,
                      uploadError: undefined,
                    }
                  : candidate,
              ),
            };

            return applyFishTransactions(nextState, [
              {
                id: `photo-${entry.id}`,
                personId,
                type: 'photo_upload',
                amount: FISH_PER_PHOTO,
                balanceAfter: 0,
                note: `Đăng ảnh: ${entry.name}`,
                createdAt: uploadedAt,
                entryId: entry.id,
              },
            ]);
          });
        } catch (error) {
          setState((current) =>
            updateEntryUploadFailure(
              current,
              entry.id,
              error instanceof Error ? error.message : 'Upload Drive thất bại.',
            ),
          );

          if (error instanceof Error && error.message.includes('401')) {
            setAccessToken(null);
            setAccessTokenExpiresAt(null);
            setDriveStatus('idle');
          }

          throw error;
        }
      }),
    );

    const uploadedCount = uploadResults.filter((result) => result.status === 'fulfilled').length;
    const failedUploads = uploadResults.length - uploadedCount;

    if (uploadedCount === 0) {
      showMessage('Upload Drive thất bại. Kiểm tra quyền folder hoặc kết nối lại Google Drive.', 2800);
      return;
    }

    showMessage(
      failedUploads > 0
        ? `Đã upload ${uploadedCount} ảnh, lỗi ${failedUploads} ảnh.`
        : `Đã upload Drive và cộng ${uploadedCount * FISH_PER_PHOTO} cá.`,
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

    const purchaseId = crypto.randomUUID();
    const purchasedAt = new Date().toISOString();
    const purchase: PurchaseEntry = {
      id: purchaseId,
      personId,
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      price: item.price,
      purchasedAt,
    };

    setState((current) => {
      const currentBalance = getWallet(current.wallets, personId).balance;

      if (currentBalance < item.price) {
        return current;
      }

      return applyFishTransactions(
        {
          ...current,
          purchases: [purchase, ...current.purchases],
        },
        [
          {
            id: `purchase-${purchaseId}`,
            personId,
            type: 'store_purchase',
            amount: -item.price,
            balanceAfter: 0,
            note: `Mua ${item.name}`,
            createdAt: purchasedAt,
            purchaseId,
            itemId: item.id,
          },
        ],
      );
    });
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

    setState((current) => ({
      ...current,
      entries: current.entries.filter((candidate) => candidate.id !== entryId),
    }));
    showMessage('Đã xóa ảnh khỏi danh sách. Ví cá và lịch sử giao dịch không đổi.', 2400);
  }

  function resetAll() {
    if (!window.confirm('Xóa toàn bộ ảnh, cá, kho và phòng trong dữ liệu chung?')) {
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
          <strong>{uploadedEntries.length}</strong>
        </div>
        <div>
          <span>Cá khả dụng</span>
          <strong>{totalBalance}</strong>
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
                <p>Ảnh và dữ liệu cá, kho, phòng được lưu trong folder Drive chung.</p>
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
              <div className="drive-button-row">
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
                <button
                  className="ghost-button"
                  disabled={!driveConfigured || syncStatus === 'loading'}
                  onClick={refreshSharedState}
                  type="button"
                >
                  <RefreshCw aria-hidden="true" />
                  Tải lại
                </button>
              </div>
            </div>

            {driveError ? <p className="drive-error">{driveError}</p> : null}
            <div className={`sync-status sync-status-${syncStatus}`}>
              <Cloud aria-hidden="true" />
              <div>
                <strong>{syncStatusLabel}</strong>
                <span>
                  {driveStateFileId
                    ? `File chung: ${DRIVE_STATE_FILE_NAME}`
                    : 'Chưa có file dữ liệu chung trên Drive.'}
                </span>
                {lastSyncedLabel ? <span>Lần cuối: {lastSyncedLabel}</span> : null}
              </div>
            </div>
            {syncError ? <p className="drive-error">{syncError}</p> : null}
          </section>

          <section className="person-grid">
            {state.people.map((person) => (
              <PersonScorePanel
                key={person.id}
                person={person}
                stats={statsByPerson[person.id]}
                entries={state.entries.filter((entry) => entry.personId === person.id)}
                purchases={state.purchases.filter((purchase) => purchase.personId === person.id)}
                transactions={state.fishTransactions.filter(
                  (transaction) => transaction.personId === person.id,
                )}
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
  transactions: FishTransaction[];
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
  transactions,
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

      <div className="transaction-summary">
        <h3>Lịch sử cá</h3>
        {transactions.length === 0 ? (
          <p className="empty-text">Chưa có giao dịch cá.</p>
        ) : (
          <div className="transaction-list">
            {transactions.slice(0, 6).map((transaction) => (
              <div className="transaction-row" key={transaction.id}>
                <span>
                  <strong>{transaction.note}</strong>
                  <small>{formatDateTime(transaction.createdAt)}</small>
                </span>
                <b className={transaction.amount >= 0 ? 'positive' : 'negative'}>
                  {formatFishAmount(transaction.amount)}
                </b>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="photo-strip">
        {entries.length === 0 ? (
          <p className="empty-text">Chưa có ảnh.</p>
        ) : (
          entries.slice(0, 12).map((entry) => {
            const imageSource = entry.dataUrl || entry.driveThumbnailLink;
            const uploadStatus = entry.uploadStatus ?? 'uploaded';

            return (
              <figure
                key={entry.id}
                className={`photo-tile photo-tile-${uploadStatus}`}
                title={entry.uploadError}
              >
                {imageSource ? (
                  <img src={imageSource} alt={entry.name} />
                ) : (
                  <div className="photo-placeholder">
                    <ImagePlus aria-hidden="true" />
                  </div>
                )}
                <figcaption>
                  {uploadStatus === 'uploading' ? (
                    <span>Đang tải</span>
                  ) : uploadStatus === 'failed' ? (
                    <span>Lỗi</span>
                  ) : entry.driveViewLink ? (
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
            );
          })
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
        {visibleItems.map((item) => (
          <article className="store-item" key={item.id}>
            <StoreItemIllustration category={item.category} itemId={item.id} title={item.name} />
            <div className="store-item-main">
              <div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
              </div>
              <strong className="store-price">{item.price} cá</strong>
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
        ))}
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
    return normalizeScoreState(JSON.parse(saved) as Partial<ScoreState>);
  } catch {
    return defaultState;
  }
}

function normalizeDriveStatePayload(payload: unknown): ScoreState {
  if (isPlainObject(payload) && isPlainObject(payload.state)) {
    return normalizeScoreState(payload.state as Partial<ScoreState>);
  }

  if (isPlainObject(payload)) {
    return normalizeScoreState(payload as Partial<ScoreState>);
  }

  return defaultState;
}

function normalizeScoreState(parsed: Partial<ScoreState> | null | undefined): ScoreState {
  const peopleSource = Array.isArray(parsed?.people) ? parsed.people : [];
  const people = defaultState.people.map((fallback, index) => {
    const person = peopleSource[index] as Partial<Person> | undefined;
    return {
      ...fallback,
      color: typeof person?.color === 'string' ? person.color : fallback.color,
      name: normalizePersonName(
        typeof person?.name === 'string' ? person.name : fallback.name,
        index,
      ),
    };
  });

  const entries = Array.isArray(parsed?.entries)
    ? parsed.entries.map((entry) => {
        const uploadStatus = isPhotoUploadStatus(entry.uploadStatus)
          ? entry.uploadStatus
          : 'uploaded';

        return {
          id: typeof entry.id === 'string' ? entry.id : crypto.randomUUID(),
          personId: isPersonId(entry.personId) ? entry.personId : 'person_a',
          name: typeof entry.name === 'string' ? entry.name : 'Ảnh',
          dataUrl: typeof entry.dataUrl === 'string' ? entry.dataUrl : '',
          points: uploadStatus === 'uploaded' ? FISH_PER_PHOTO : 0,
          createdAt:
            typeof entry.createdAt === 'string' ? entry.createdAt : new Date().toISOString(),
          driveFileId: optionalString(entry.driveFileId),
          driveViewLink: optionalString(entry.driveViewLink),
          driveThumbnailLink: optionalString(entry.driveThumbnailLink),
          uploadStatus,
          uploadError: optionalString(entry.uploadError),
        };
      })
    : [];

  const purchases = Array.isArray(parsed?.purchases)
    ? parsed.purchases.map((purchase) => {
        const itemId = typeof purchase.itemId === 'string' ? purchase.itemId : 'unknown';
        const category = isStoreCategory(purchase.category) ? purchase.category : 'food';
        const fallbackName = typeof purchase.itemName === 'string' ? purchase.itemName : 'Vật phẩm';
        return {
          id: typeof purchase.id === 'string' ? purchase.id : crypto.randomUUID(),
          personId: isPersonId(purchase.personId) ? purchase.personId : 'person_a',
          itemId,
          itemName: getStoreItemName(itemId, fallbackName),
          category,
          price: typeof purchase.price === 'number' ? purchase.price : 0,
          purchasedAt:
            typeof purchase.purchasedAt === 'string' ? purchase.purchasedAt : new Date().toISOString(),
        };
      })
    : [];

  const roomPlacements = Array.isArray(parsed?.roomPlacements)
    ? parsed.roomPlacements.map((placement, index) => {
        const itemId = typeof placement.itemId === 'string' ? placement.itemId : 'unknown';
        const fallbackName = typeof placement.itemName === 'string' ? placement.itemName : 'Nội thất';
        return {
          id: typeof placement.id === 'string' ? placement.id : crypto.randomUUID(),
          purchaseId:
            typeof placement.purchaseId === 'string' ? placement.purchaseId : crypto.randomUUID(),
          itemId,
          itemName: getStoreItemName(itemId, fallbackName),
          personId: isPersonId(placement.personId) ? placement.personId : 'person_a',
          xRatio: clampRatio(placement.xRatio),
          yRatio: clampRatio(placement.yRatio),
          zIndex: typeof placement.zIndex === 'number' ? placement.zIndex : index + 1,
        };
      })
    : [];
  const fishTransactions = normalizeFishTransactions(
    Array.isArray(parsed?.fishTransactions) ? parsed.fishTransactions : null,
    entries,
    purchases,
  );
  const wallets = rebuildWalletsFromTransactions(fishTransactions, people);

  return {
    people,
    entries,
    purchases,
    roomPlacements,
    wallets,
    fishTransactions,
  };
}

function normalizeFishTransactions(
  parsedTransactions: FishTransaction[] | null,
  entries: PhotoEntry[],
  purchases: PurchaseEntry[],
) {
  if (parsedTransactions && parsedTransactions.length > 0) {
    return finalizeFishTransactions(
      parsedTransactions
        .filter((transaction) => isPersonId(transaction.personId))
        .map((transaction) => ({
          id: typeof transaction.id === 'string' ? transaction.id : crypto.randomUUID(),
          personId: transaction.personId,
          type: isFishTransactionType(transaction.type) ? transaction.type : 'migration_adjustment',
          amount: normalizeFishAmount(transaction.amount),
          balanceAfter: 0,
          note:
            typeof transaction.note === 'string' && transaction.note.trim()
              ? transaction.note.trim()
              : getDefaultTransactionNote(transaction.type, transaction.amount),
          createdAt:
            typeof transaction.createdAt === 'string'
              ? transaction.createdAt
              : new Date().toISOString(),
          entryId: optionalString(transaction.entryId),
          purchaseId: optionalString(transaction.purchaseId),
          itemId: optionalString(transaction.itemId),
        })),
    );
  }

  return finalizeFishTransactions([
    ...entries.filter(isUploadedEntry).map((entry) => ({
      id: `legacy-photo-${entry.id}`,
      personId: entry.personId,
      type: 'photo_upload' as FishTransactionType,
      amount: FISH_PER_PHOTO,
      balanceAfter: 0,
      note: `Đăng ảnh: ${entry.name}`,
      createdAt: entry.createdAt,
      entryId: entry.id,
    })),
    ...purchases.map((purchase) => ({
      id: `legacy-purchase-${purchase.id}`,
      personId: purchase.personId,
      type: 'store_purchase' as FishTransactionType,
      amount: -purchase.price,
      balanceAfter: 0,
      note: `Mua ${purchase.itemName}`,
      createdAt: purchase.purchasedAt,
      purchaseId: purchase.id,
      itemId: purchase.itemId,
    })),
  ]);
}

function finalizeFishTransactions(transactions: FishTransaction[]) {
  const balances: Record<PersonId, number> = { person_a: 0, person_b: 0 };
  const seenIds = new Set<string>();
  const uniqueTransactions = transactions.filter((transaction) => {
    if (seenIds.has(transaction.id)) {
      return false;
    }

    seenIds.add(transaction.id);
    return true;
  });
  const applied = uniqueTransactions
    .sort(compareTransactionsOldestFirst)
    .map((transaction) => {
      const amount = normalizeFishAmount(transaction.amount);
      balances[transaction.personId] += amount;

      return {
        ...transaction,
        amount,
        balanceAfter: balances[transaction.personId],
      };
    });

  return applied.sort(compareTransactionsNewestFirst);
}

function rebuildWalletsFromTransactions(transactions: FishTransaction[], people: Person[]) {
  const wallets = people.reduce<Record<PersonId, FishWallet>>(
    (acc, person) => {
      acc[person.id] = createEmptyWallet(person.id);
      return acc;
    },
    { person_a: createEmptyWallet('person_a'), person_b: createEmptyWallet('person_b') },
  );

  [...transactions].sort(compareTransactionsOldestFirst).forEach((transaction) => {
    const wallet = wallets[transaction.personId];

    wallet.balance += transaction.amount;

    if (transaction.amount >= 0) {
      wallet.earnedTotal += transaction.amount;
    } else {
      wallet.spentTotal += Math.abs(transaction.amount);
    }

    wallet.updatedAt = transaction.createdAt;
  });

  return people.map((person) => wallets[person.id] ?? createEmptyWallet(person.id));
}

function applyFishTransactions(state: ScoreState, transactions: FishTransaction[]): ScoreState {
  const fishTransactions = finalizeFishTransactions([...state.fishTransactions, ...transactions]);

  return {
    ...state,
    fishTransactions,
    wallets: rebuildWalletsFromTransactions(fishTransactions, state.people),
  };
}

function updateEntryPreview(state: ScoreState, entryId: string, dataUrl: string): ScoreState {
  return {
    ...state,
    entries: state.entries.map((entry) => (entry.id === entryId ? { ...entry, dataUrl } : entry)),
  };
}

function updateEntryUploadFailure(state: ScoreState, entryId: string, uploadError: string): ScoreState {
  return {
    ...state,
    entries: state.entries.map((entry) =>
      entry.id === entryId
        ? {
            ...entry,
            points: 0,
            uploadStatus: 'failed',
            uploadError,
          }
        : entry,
    ),
  };
}

function isUploadedEntry(entry: PhotoEntry) {
  return !entry.uploadStatus || entry.uploadStatus === 'uploaded';
}

function getWallet(wallets: FishWallet[], personId: PersonId) {
  return wallets.find((wallet) => wallet.personId === personId) ?? createEmptyWallet(personId);
}

function createEmptyWallet(personId: PersonId): FishWallet {
  return {
    personId,
    balance: 0,
    earnedTotal: 0,
    spentTotal: 0,
    updatedAt: INITIAL_WALLET_DATE,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPersonId(value: unknown): value is PersonId {
  return value === 'person_a' || value === 'person_b';
}

function isStoreCategory(value: unknown): value is StoreCategory {
  return value === 'food' || value === 'furniture' || value === 'clothes';
}

function isFishTransactionType(value: unknown): value is FishTransactionType {
  return value === 'photo_upload' || value === 'store_purchase' || value === 'migration_adjustment';
}

function isPhotoUploadStatus(value: unknown): value is PhotoUploadStatus {
  return value === 'uploading' || value === 'uploaded' || value === 'failed';
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function normalizeFishAmount(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  return Math.trunc(value);
}

function compareTransactionsOldestFirst(first: FishTransaction, second: FishTransaction) {
  const timeDiff = getTimeValue(first.createdAt) - getTimeValue(second.createdAt);

  if (timeDiff !== 0) {
    return timeDiff;
  }

  return first.id.localeCompare(second.id);
}

function compareTransactionsNewestFirst(first: FishTransaction, second: FishTransaction) {
  const timeDiff = getTimeValue(second.createdAt) - getTimeValue(first.createdAt);

  if (timeDiff !== 0) {
    return timeDiff;
  }

  return second.id.localeCompare(first.id);
}

function getTimeValue(value: string) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getDefaultTransactionNote(type: unknown, amount: unknown) {
  if (type === 'photo_upload' || normalizeFishAmount(amount) > 0) {
    return 'Cộng cá';
  }

  if (type === 'store_purchase' || normalizeFishAmount(amount) < 0) {
    return 'Trừ cá';
  }

  return 'Điều chỉnh ví cá';
}

function formatFishAmount(amount: number) {
  return `${amount > 0 ? '+' : ''}${amount} cá`;
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

function getStats(entries: PhotoEntry[], wallet: FishWallet): BaseStats {
  const todayKey = toDateKey(new Date());
  const activeDays = new Set(entries.map((entry) => toDateKey(new Date(entry.createdAt))));

  return {
    totalPhotos: entries.length,
    todayPhotos: entries.filter((entry) => toDateKey(new Date(entry.createdAt)) === todayKey).length,
    earnedPoints: wallet.earnedTotal,
    spentPoints: wallet.spentTotal,
    balancePoints: wallet.balance,
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

async function findDriveStateFile(accessToken: string, folderId: string) {
  const query = [
    `'${escapeDriveQueryValue(folderId)}' in parents`,
    `name = '${escapeDriveQueryValue(DRIVE_STATE_FILE_NAME)}'`,
    'trashed = false',
  ].join(' and ');
  const params = new URLSearchParams({
    q: query,
    spaces: 'drive',
    fields: 'files(id,name,modifiedTime)',
    orderBy: 'modifiedTime desc',
    pageSize: '1',
  });

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await readDriveError(response, 'Drive state lookup failed'));
  }

  const data = (await response.json()) as { files?: DriveFileMetadata[] };
  return Array.isArray(data.files) ? data.files[0] ?? null : null;
}

async function downloadDriveStateFile(accessToken: string, fileId: string) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(await readDriveError(response, 'Drive state download failed'));
  }

  return normalizeDriveStatePayload(await response.json());
}

async function createDriveStateFile(accessToken: string, folderId: string, state: ScoreState) {
  const metadata = {
    name: DRIVE_STATE_FILE_NAME,
    mimeType: DRIVE_JSON_MIME_TYPE,
    parents: [folderId],
  };
  const payload = JSON.stringify(createDriveStatePayload(state), null, 2);
  const { body, boundary } = createMultipartBody(metadata, payload, DRIVE_JSON_MIME_TYPE);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime',
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
    throw new Error(await readDriveError(response, 'Drive state create failed'));
  }

  return (await response.json()) as DriveFileMetadata;
}

async function updateDriveStateFile(accessToken: string, fileId: string, state: ScoreState) {
  const metadata = {
    name: DRIVE_STATE_FILE_NAME,
    mimeType: DRIVE_JSON_MIME_TYPE,
  };
  const payload = JSON.stringify(createDriveStatePayload(state), null, 2);
  const { body, boundary } = createMultipartBody(metadata, payload, DRIVE_JSON_MIME_TYPE);

  const response = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(
      fileId,
    )}?uploadType=multipart&fields=id,name,modifiedTime`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );

  if (!response.ok) {
    throw new Error(await readDriveError(response, 'Drive state update failed'));
  }

  return (await response.json()) as DriveFileMetadata;
}

function createDriveStatePayload(state: ScoreState): DriveStateFile {
  return {
    version: 3,
    updatedAt: new Date().toISOString(),
    state: normalizeScoreState(state),
  };
}

function createMultipartBody(
  metadata: Record<string, unknown>,
  content: BlobPart,
  contentType: string,
) {
  const boundary = `photo_score_${crypto.randomUUID()}`;
  const body = new Blob(
    [
      `--${boundary}\r\n`,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify(metadata),
      `\r\n--${boundary}\r\n`,
      `Content-Type: ${contentType}; charset=UTF-8\r\n\r\n`,
      content,
      `\r\n--${boundary}--`,
    ],
    { type: `multipart/related; boundary=${boundary}` },
  );

  return { boundary, body };
}

function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function readDriveError(response: Response, label: string) {
  const text = await response.text();
  return `${label} ${response.status}: ${text}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function isAuthError(message: string) {
  return message.includes(' 401') || message.toLowerCase().includes('invalid_grant');
}

function getSyncStatusLabel(status: SyncStatus) {
  if (status === 'loading') {
    return 'Đang tải dữ liệu chung';
  }

  if (status === 'saving') {
    return 'Đang lưu dữ liệu chung';
  }

  if (status === 'synced') {
    return 'Đã đồng bộ với Google Drive';
  }

  if (status === 'error') {
    return 'Đồng bộ lỗi';
  }

  return 'Chưa đồng bộ Drive';
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
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

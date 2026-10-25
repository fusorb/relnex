/**
 * Centralized icon system using lucide-react
 * Ensures consistent icon usage across the entire application
 * Maps semantic icon names to lucide icons for easy maintenance and updates
 */

import {
  // Navigation & UI
  Menu,
  X,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  MoreHorizontal,
  Search,
  Filter,
  Settings,
  User,
  LogOut,
  Bell,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Flag,
  Trash2,
  Edit,
  Copy,
  Download,
  Upload,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Check,
  X as XIcon,
  Plus,
  Minus,
  Loader,
  AlertCircle,
  CheckCircle2,
  XCircle,
  // Content & Resources
  FileText,
  BookOpen,
  Lightbulb,
  Zap,
  Network,
  History,
  BarChart3,
  TrendingUp,
  Activity,
  Calendar,
  Clock,
  MapPin,
  Link,
  GitBranch,
  Bird,
  Mail,
  Shield,
  Home,
  Folder,
  FolderOpen,
  Archive,
  Image,
  Video,
  Music,
  File,
  Code,
  AlertTriangle,
  Info,
  HelpCircle,
  Users,
  Send,
} from "@fusorb/facet-components/icons";

/**
 * Icon registry mapping semantic names to lucide icons
 * This makes it easy to swap icons globally or per-component
 */
export const ICON_REGISTRY = {
  // Navigation
  menu: Menu,
  close: X,
  back: ArrowLeft,
  next: ArrowRight,
  dropdown: ChevronDown,
  up: ChevronUp,
  right: ChevronRight,
  left: ChevronLeft,
  moreVertical: MoreVertical,
  moreHorizontal: MoreHorizontal,

  // Actions
  search: Search,
  filter: Filter,
  settings: Settings,
  edit: Edit,
  delete: Trash2,
  copy: Copy,
  download: Download,
  upload: Upload,
  add: Plus,
  remove: Minus,
  send: Send,
  share: Share2,

  // User & Auth
  user: User,
  logout: LogOut,
  lock: Lock,
  unlock: Unlock,
  users: Users,

  // Content
  resource: BookOpen,
  article: FileText,
  note: FileText,
  collection: Folder,
  collectionOpen: FolderOpen,
  link: Link,
  image: Image,
  video: Video,
  audio: Music,
  file: File,
  code: Code,
  archive: Archive,

  // Engagement
  comment: MessageCircle,
  like: Heart,
  bookmark: Bookmark,
  flag: Flag,
  view: Eye,
  hide: EyeOff,

  // Analytics & Status
  analytics: BarChart3,
  chart: BarChart3,
  trend: TrendingUp,
  activity: Activity,
  history: History,
  calendar: Calendar,
  time: Clock,
  location: MapPin,

  // Status indicators
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  alert: AlertCircle,
  help: HelpCircle,
  loading: Loader,
  check: Check,

  // Semantic
  knowledge: Network,
  idea: Lightbulb,
  power: Zap,
  shield: Shield,
  home: Home,

  // Social
  github: GitBranch,
  twitter: Bird,
  email: Mail,
} as const;

export type IconName = keyof typeof ICON_REGISTRY;

/**
 * Get icon component by name
 * @param name - Icon name from registry
 * @returns Lucide icon component
 */
export function getIcon(name: IconName) {
  return ICON_REGISTRY[name];
}

/**
 * Icon component wrapper with consistent sizing
 * Ensures all icons maintain visual consistency across the app
 */
export const IconSizes = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
  "2xl": "h-12 w-12",
} as const;

export type IconSize = keyof typeof IconSizes;

/**
 * Feature icons for marketing/landing pages
 */
export const FEATURE_ICONS = {
  knowledgeGraph: Network,
  richContent: FileText,
  search: Search,
  collaboration: MessageCircle,
  versioning: History,
  analytics: BarChart3,
  security: Shield,
  performance: Zap,
} as const;

/**
 * Resource type icons
 */
export const RESOURCE_TYPE_ICONS = {
  ARTICLE: FileText,
  NOTE: FileText,
  MODULE: BookOpen,
  VIDEO: Video,
  IMAGE: Image,
  FILE: File,
  LINK: Link,
  AI_OUTPUT: Lightbulb,
} as const;

/**
 * Status icons
 */
export const STATUS_ICONS = {
  DRAFT: Edit,
  PUBLISHED: CheckCircle2,
  ARCHIVED: Archive,
  ACTIVE: CheckCircle2,
  HIDDEN: EyeOff,
  DELETED: XCircle,
} as const;

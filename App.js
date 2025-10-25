import React, { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  StatusBar,
  Platform,
  UIManager,
  LayoutAnimation,
  Alert,
  Switch,
  Share,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as Notifications from 'expo-notifications';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STORAGE_KEY = '@cute_notepad_notes_v1';
const MODE_STORAGE_KEY = '@cute_notepad_mode_v1';
const PALETTE_STORAGE_KEY = '@cute_notepad_palette_v1';

// Notification setup
async function setupNotifications() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== 'granted') {
      Alert.alert('Error', 'Notification permissions are required for reminders.');
    }
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function uid() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}

// Schedule a notification
async function scheduleNotification(note) {
  if (!note.reminder) return null;
  const trigger = new Date(note.reminder);
  if (trigger <= new Date()) return null;

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: note.title || 'Note Reminder',
        body: note.type === 'todo' ? note.checklist.map((item) => item.text).join('\n') : note.body || 'No content',
      },
      trigger,
    });
    return identifier;
  } catch (error) {
    console.warn('Error scheduling notification:', error);
    return null;
  }
}

// Cancel a notification
async function cancelNotification(identifier) {
  if (identifier) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.warn('Error cancelling notification:', error);
    }
  }
}

// Function to get greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 12) {
    return 'Good Morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good Afternoon';
  } else {
    return 'Good Evening';
  }
};

const colors = {
  'default-light': {
    primaryBg: '#FFF7FB',
    secondaryBg: '#FFFFFF',
    primaryText: '#4a2b4a',
    secondaryText: '#5b3b5b',
    tertiaryText: '#9b7b9b',
    headerText: '#6b2d6b',
    accent: '#ff6fa3',
    accentLight: '#FFD9E8',
    shadow: '#6b2d6b',
    border: '#E0E0E0',
    tagBg: '#F3E8FF',
    pinnedBg: '#E6FFF4',
    pinnedBorder: '#FFD9E8',
    fabShadow: '#ff6fa3',
    modalClose: '#6b2d6b',
    cardTagText: '#6b2d6b',
    switchFalse: '#9e9e9e',
    switchTrue: '#FFD9E8',
    thumb: '#ff6fa3',
    icon: '#6b2d6b',
    placeholder: '#9e9e9e',
  },
  'default-dark': {
    primaryBg: '#1A1A1A',
    secondaryBg: '#333333',
    primaryText: '#E0E0E0',
    secondaryText: '#B0B0B0',
    tertiaryText: '#757575',
    headerText: '#F5F5F5',
    accent: '#F06292',
    accentLight: '#F06292',
    shadow: '#000000',
    border: '#4A4A4A',
    tagBg: '#9575CD',
    pinnedBg: '#26A69A',
    pinnedBorder: '#F06292',
    fabShadow: '#F06292',
    modalClose: '#F5F5F5',
    cardTagText: '#FFFFFF',
    switchFalse: '#757575',
    switchTrue: '#F06292',
    thumb: '#F06292',
    icon: '#F5F5F5',
    placeholder: '#757575',
  },
  'blue-light': {
    primaryBg: '#FAFDFF',
    secondaryBg: '#FFFFFF',
    primaryText: '#01579B',
    secondaryText: '#039BE5',
    tertiaryText: '#64B5F6',
    headerText: '#0288D1',
    accent: '#03A9F4',
    accentLight: '#81D4FA',
    shadow: '#0288D1',
    border: '#BBDEFB',
    tagBg: '#E1F5FE',
    pinnedBg: '#E1F5FE',
    pinnedBorder: '#81D4FA',
    fabShadow: '#03A9F4',
    modalClose: '#0288D1',
    cardTagText: '#0288D1',
    switchFalse: '#9e9e9e',
    switchTrue: '#81D4FA',
    thumb: '#03A9F4',
    icon: '#0288D1',
    placeholder: '#64B5F6',
  },
  'blue-dark': {
    primaryBg: '#0A192F',
    secondaryBg: '#1E293B',
    primaryText: '#BBDEFB',
    secondaryText: '#90CAF9',
    tertiaryText: '#64B5F6',
    headerText: '#E3F2FD',
    accent: '#3B82F6',
    accentLight: '#3B82F6',
    shadow: '#000000',
    border: '#475569',
    tagBg: '#1E88E5',
    pinnedBg: '#1976D2',
    pinnedBorder: '#3B82F6',
    fabShadow: '#3B82F6',
    modalClose: '#E3F2FD',
    cardTagText: '#FFFFFF',
    switchFalse: '#475569',
    switchTrue: '#3B82F6',
    thumb: '#3B82F6',
    icon: '#E3F2FD',
    placeholder: '#90CAF9',
  },
  'green-light': {
    primaryBg: '#F6FFED',
    secondaryBg: '#FFFFFF',
    primaryText: '#33691E',
    secondaryText: '#689F38',
    tertiaryText: '#AED581',
    headerText: '#388E3C',
    accent: '#66BB6A',
    accentLight: '#A5D6A7',
    shadow: '#388E3C',
    border: '#C5E1A5',
    tagBg: '#DCEDC8',
    pinnedBg: '#DCEDC8',
    pinnedBorder: '#A5D6A7',
    fabShadow: '#66BB6A',
    modalClose: '#388E3C',
    cardTagText: '#388E3C',
    switchFalse: '#9e9e9e',
    switchTrue: '#A5D6A7',
    thumb: '#66BB6A',
    icon: '#388E3C',
    placeholder: '#AED581',
  },
  'green-dark': {
    primaryBg: '#102027',
    secondaryBg: '#1C3D35',
    primaryText: '#C8E6C9',
    secondaryText: '#A5D6A7',
    tertiaryText: '#81C784',
    headerText: '#E8F5E9',
    accent: '#4CAF50',
    accentLight: '#4CAF50',
    shadow: '#000000',
    border: '#388E3C',
    tagBg: '#2E7D32',
    pinnedBg: '#1B5E20',
    pinnedBorder: '#4CAF50',
    fabShadow: '#4CAF50',
    modalClose: '#E8F5E9',
    cardTagText: '#FFFFFF',
    switchFalse: '#388E3C',
    switchTrue: '#4CAF50',
    thumb: '#4CAF50',
    icon: '#E8F5E9',
    placeholder: '#81C784',
  },
  'yellow-light': {
    primaryBg: '#FFFDE7',
    secondaryBg: '#FFFFFF',
    primaryText: '#F57F17',
    secondaryText: '#F9A825',
    tertiaryText: '#FFEE58',
    headerText: '#F57F17',
    accent: '#FFEE58',
    accentLight: '#FFF59D',
    shadow: '#F9A825',
    border: '#FFE082',
    tagBg: '#FFF9C4',
    pinnedBg: '#FFF9C4',
    pinnedBorder: '#FFF59D',
    fabShadow: '#FFEE58',
    modalClose: '#F57F17',
    cardTagText: '#F57F17',
    switchFalse: '#9e9e9e',
    switchTrue: '#FFF59D',
    thumb: '#FFEE58',
    icon: '#F57F17',
    placeholder: '#FFEE58',
  },
  'yellow-dark': {
    primaryBg: '#1F1A00',
    secondaryBg: '#3B3500',
    primaryText: '#FFF59D',
    secondaryText: '#FFF176',
    tertiaryText: '#FFEE58',
    headerText: '#FFFDE7',
    accent: '#FFEB3B',
    accentLight: '#FFEB3B',
    shadow: '#000000',
    border: '#F9A825',
    tagBg: '#FBC02D',
    pinnedBg: '#F57F17',
    pinnedBorder: '#FFEB3B',
    fabShadow: '#FFEB3B',
    modalClose: '#FFFDE7',
    cardTagText: '#000000',
    switchFalse: '#F9A825',
    switchTrue: '#FFEB3B',
    thumb: '#FFEB3B',
    icon: '#FFFDE7',
    placeholder: '#FFEE58',
  },
  'purple-light': {
    primaryBg: '#FCF8FF',
    secondaryBg: '#FFFFFF',
    primaryText: '#4A148C',
    secondaryText: '#7B1FA2',
    tertiaryText: '#BA68C8',
    headerText: '#6A1B9A',
    accent: '#BA68C8',
    accentLight: '#E1BEE7',
    shadow: '#7B1FA2',
    border: '#CE93D8',
    tagBg: '#F3E5F5',
    pinnedBg: '#F3E5F5',
    pinnedBorder: '#E1BEE7',
    fabShadow: '#BA68C8',
    modalClose: '#6A1B9A',
    cardTagText: '#6A1B9A',
    switchFalse: '#9e9e9e',
    switchTrue: '#E1BEE7',
    thumb: '#BA68C8',
    icon: '#6A1B9A',
    placeholder: '#BA68C8',
  },
  'purple-dark': {
    primaryBg: '#1A001A',
    secondaryBg: '#300030',
    primaryText: '#E1BEE7',
    secondaryText: '#CE93D8',
    tertiaryText: '#BA68C8',
    headerText: '#F3E5F5',
    accent: '#AB47BC',
    accentLight: '#AB47BC',
    shadow: '#000000',
    border: '#7B1FA2',
    tagBg: '#6A1B9A',
    pinnedBg: '#4A148C',
    pinnedBorder: '#AB47BC',
    fabShadow: '#AB47BC',
    modalClose: '#F3E5F5',
    cardTagText: '#FFFFFF',
    switchFalse: '#7B1FA2',
    switchTrue: '#AB47BC',
    thumb: '#AB47BC',
    icon: '#F3E5F5',
    placeholder: '#BA68C8',
  },
  'orange-light': {
    primaryBg: '#FFF3E0',
    secondaryBg: '#FFFFFF',
    primaryText: '#BF360C',
    secondaryText: '#EF6C00',
    tertiaryText: '#FFAB91',
    headerText: '#E65100',
    accent: '#FFAB91',
    accentLight: '#FFCCBC',
    shadow: '#EF6C00',
    border: '#FFAB91',
    tagBg: '#FFE0B2',
    pinnedBg: '#FFE0B2',
    pinnedBorder: '#FFCCBC',
    fabShadow: '#FFAB91',
    modalClose: '#E65100',
    cardTagText: '#E65100',
    switchFalse: '#9e9e9e',
    switchTrue: '#FFCCBC',
    thumb: '#FFAB91',
    icon: '#E65100',
    placeholder: '#FFAB91',
  },
  'orange-dark': {
    primaryBg: '#2D1400',
    secondaryBg: '#4E2A0B',
    primaryText: '#FFCCBC',
    secondaryText: '#FFB74D',
    tertiaryText: '#FFA726',
    headerText: '#FFE0B2',
    accent: '#FF7043',
    accentLight: '#FF7043',
    shadow: '#000000',
    border: '#EF6C00',
    tagBg: '#EF6C00',
    pinnedBg: '#D84315',
    pinnedBorder: '#FF7043',
    fabShadow: '#FF7043',
    modalClose: '#FFE0B2',
    cardTagText: '#FFFFFF',
    switchFalse: '#EF6C00',
    switchTrue: '#FF7043',
    thumb: '#FF7043',
    icon: '#FFE0B2',
    placeholder: '#FFA726',
  },
};

const createStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.primaryBg },
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: c.headerText, marginBottom: 8 },
  search: {
    flex: 1,
    backgroundColor: c.secondaryBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    shadowColor: c.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    color: c.primaryText,
    borderWidth: 1,
    borderColor: c.border,
  },
  themeToggle: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: c.secondaryBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: c.shadow,
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: c.border,
  },
  themeLabel: { fontSize: 16, marginRight: 8, color: c.primaryText, fontWeight: '600' },
  tagsContainer: { marginTop: 10, marginBottom: 10 },
  tagButton: {
    backgroundColor: c.secondaryBg,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: c.border,
  },
  tagButtonSelected: { backgroundColor: c.accentLight, borderColor: c.accent },
  tagText: { fontSize: 14, color: c.primaryText, fontWeight: '600' },
  tagTextSelected: { color: c.headerText },
  listContainer: { paddingHorizontal: 8, paddingTop: 10 },
  card: {
    backgroundColor: c.secondaryBg,
    borderRadius: 14,
    padding: 10,
    shadowColor: c.shadow,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: c.border,
  },
  cardPinned: { borderWidth: 2, borderColor: c.pinnedBorder, backgroundColor: c.pinnedBg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: c.primaryText, flex: 1, marginRight: 8 },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 8, borderRadius: 8 },
  actionEmoji: { fontSize: 18 },
  cardBody: { marginTop: 4, fontSize: 14, color: c.secondaryText },
  cardTags: { marginTop: 4, flexDirection: 'row', flexWrap: 'wrap' },
  cardTag: {
    backgroundColor: c.tagBg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  cardTagText: { fontSize: 12, color: c.cardTagText },
  cardFooter: { marginTop: 6, alignItems: 'flex-end' },
  footerText: { fontSize: 11, color: c.tertiaryText },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: c.tertiaryText, fontSize: 16 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 34,
    backgroundColor: c.accent,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: c.fabShadow,
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  fabText: { color: '#fff', fontSize: 34, lineHeight: 36 },
  modalContainer: { flex: 1, backgroundColor: c.primaryBg },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },
  modalClose: { fontSize: 22, color: c.modalClose },
  modalTitle: { fontSize: 28, color: c.headerText, fontWeight: '700' },
  modalSave: { fontSize: 16, color: c.accent, fontWeight: '700' },
  modalBody: { paddingHorizontal: 16, paddingTop: 8 },
  inputTitle: {
    backgroundColor: c.secondaryBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    shadowColor: c.shadow,
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    color: c.primaryText,
    borderWidth: 1,
    borderColor: c.border,
  },
  inputBody: {
    backgroundColor: c.secondaryBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 160,
    textAlignVertical: 'top',
    shadowColor: c.shadow,
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    color: c.primaryText,
    borderWidth: 1,
    borderColor: c.border,
  },
  inputTags: {
    backgroundColor: c.secondaryBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    shadowColor: c.shadow,
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    color: c.primaryText,
    borderWidth: 1,
    borderColor: c.border,
    minHeight: 40,
  },
  pinRow: { marginTop: 12, flexDirection: 'row' },
  pinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.secondaryBg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: c.shadow,
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: c.border,
  },
  pinEmoji: { fontSize: 18, marginRight: 8 },
  pinText: { fontSize: 14, color: c.headerText, fontWeight: '600' },
  typeToggleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  typeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: c.secondaryBg,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: c.border,
  },
  typeButtonSelected: { backgroundColor: c.accentLight, borderColor: c.accent },
  typeButtonText: { fontSize: 14, color: c.primaryText, fontWeight: '600' },
  typeButtonTextSelected: { color: c.headerText },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: c.secondaryBg,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: c.border,
  },
  checklistInput: { flex: 1, fontSize: 15, color: c.primaryText, paddingVertical: 0 },
  checklistAddButton: {
    padding: 10,
    backgroundColor: c.accent,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  checklistAddText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  checklistCheckbox: { marginRight: 10 },
  reminderRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.secondaryBg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: c.shadow,
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: c.border,
    marginRight: 10,
  },
  reminderText: { fontSize: 14, color: c.headerText, fontWeight: '600' },
  reminderClearBtn: { padding: 8 },
  cardReminder: { marginTop: 8, fontSize: 13, color: c.accent, fontWeight: '600' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: c.primaryBg,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  pickerContainer: {
    backgroundColor: c.secondaryBg,
    borderRadius: 12,
    shadowColor: c.shadow,
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: c.border,
  },
  actionModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  actionModalContent: {
    backgroundColor: c.secondaryBg,
    borderRadius: 14,
    padding: 16,
    width: '80%',
    shadowColor: c.shadow,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: c.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: c.headerText,
    marginBottom: 16,
    textAlign: 'center',
  },
  actionModalButton: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: c.accentLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.accent,
  },
  actionModalButtonText: {
    fontSize: 16,
    color: c.headerText,
    fontWeight: '600',
  },
  actionModalDeleteButton: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: c.accentLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.accent,
  },
  actionModalDeleteButtonText: {
    fontSize: 16,
    color: '#FF0000',
    fontWeight: '600',
  },
  actionModalCancelButton: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: c.secondaryBg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border,
  },
  actionModalCancelButtonText: {
    fontSize: 16,
    color: c.primaryText,
    fontWeight: '600',
  },
});

function MainApp() {
  const [notes, setNotes] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [modalVisible, setModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [mode, setMode] = useState('light');
  const [palette, setPalette] = useState('default');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const titleRef = useRef(null);
  const scrollRef = useRef(null);
  const insets = useSafeAreaInsets();

  const currentTheme = `${palette}-${mode}`;
  const themeColors = colors[currentTheme];
  const styles = createStyles(themeColors);
  const placeholderColor = themeColors.placeholder;
  const switchTrackColor = {
    false: themeColors.switchFalse,
    true: themeColors.switchTrue,
  };
  const switchThumbColor = themeColors.thumb;
  const iconColor = themeColors.icon;

  useEffect(() => {
    setupNotifications();
    loadNotes();
    loadMode();
    loadPalette();
    // Add a test note to ensure cards render
    setNotes([
      {
        id: uid(),
        title: 'Test Note',
        body: 'This is a test note to ensure cards render.',
        tags: ['TEST'],
        pinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        type: 'text',
        checklist: [],
        reminder: null,
        notificationId: null,
      },
    ]);
  }, []);

  useEffect(() => {
    console.log('Notes updated:', notes);
    saveNotes();
  }, [notes]);

  useEffect(() => {
    saveMode();
    savePalette();
  }, [mode, palette]);

  const loadNotes = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const loadedNotes = JSON.parse(raw).map((note) => ({
          ...note,
          type: note.type || 'text',
          tags: note.tags ? note.tags.map((tag) => tag.toUpperCase()) : [],
          checklist: note.checklist || [],
          reminder: note.reminder || null,
          notificationId: note.notificationId || null,
        }));
        console.log('Loaded notes:', loadedNotes);
        setNotes(loadedNotes);
      }
    } catch (e) {
      console.warn('Failed loading notes', e);
      Alert.alert('Error', 'Failed to load notes. Please try again.');
    }
  };

  const saveNotes = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.warn('Failed saving notes', e);
      Alert.alert('Error', 'Failed to save notes. Please try again.');
    }
  };

  const loadMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(MODE_STORAGE_KEY);
      if (savedMode && ['light', 'dark'].includes(savedMode)) {
        setMode(savedMode);
      }
    } catch (e) {
      console.warn('Failed loading mode', e);
    }
  };

  const saveMode = async () => {
    try {
      await AsyncStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch (e) {
      console.warn('Failed saving mode', e);
    }
  };

  const loadPalette = async () => {
    try {
      const savedPalette = await AsyncStorage.getItem(PALETTE_STORAGE_KEY);
      if (savedPalette && ['default', 'blue', 'green', 'yellow', 'purple', 'orange'].includes(savedPalette)) {
        setPalette(savedPalette);
      }
    } catch (e) {
      console.warn('Failed loading palette', e);
    }
  };

  const savePalette = async () => {
    try {
      await AsyncStorage.setItem(PALETTE_STORAGE_KEY, palette);
    } catch (e) {
      console.warn('Failed saving palette', e);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const openNewNote = () => {
    setEditingNote({
      id: null,
      title: '',
      body: '',
      tags: [],
      tagsInput: '',
      pinned: false,
      type: 'text',
      checklist: [],
      newChecklistItem: '',
      reminder: null,
      notificationId: null,
    });
    setModalVisible(true);
    setTimeout(() => titleRef.current && titleRef.current.focus(), 300);
  };

  const openEditNote = (note) => {
    setEditingNote({
      ...note,
      tags: note.tags || [],
      tagsInput: (note.tags || []).join(', '),
      type: note.type || 'text',
      checklist: note.checklist || [],
      newChecklistItem: '',
      reminder: note.reminder || null,
      notificationId: note.notificationId || null,
    });
    setModalVisible(true);
    setTimeout(() => titleRef.current && titleRef.current.focus(), 300);
  };

  const saveEditing = async () => {
    const t = (editingNote.title || '').trim();
    const b = (editingNote.body || '').trim();
    const checklist = editingNote.checklist || [];
    if (!t && !b && checklist.length === 0) {
      setModalVisible(false);
      return;
    }

    const tags = (editingNote.tagsInput || '')
      .split(',')
      .map((tag) => tag.trim().toUpperCase())
      .filter((tag) => tag.length > 0);

    if (editingNote.notificationId) {
      await cancelNotification(editingNote.notificationId);
    }

    let notificationId = null;
    if (editingNote.reminder) {
      notificationId = await scheduleNotification({
        ...editingNote,
        title: t,
        body: b,
        tags,
        checklist,
      });
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (editingNote.id) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNote.id
            ? { ...n, title: t, body: b, tags, checklist, reminder: editingNote.reminder, notificationId, updatedAt: Date.now() }
            : n
        )
      );
    } else {
      const newNote = {
        id: uid(),
        title: t,
        body: b,
        tags,
        pinned: editingNote.pinned || false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        type: editingNote.type || 'text',
        checklist,
        reminder: editingNote.reminder,
        notificationId,
      };
      setNotes((prev) => [newNote, ...prev]);
    }
    setModalVisible(false);
  };

  const togglePin = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  };

  const deleteNote = async (id) => {
    const note = notes.find((n) => n.id === id);
    if (note && note.notificationId) {
      await cancelNotification(note.notificationId);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const shareNote = async (note) => {
    try {
      const title = note.title || 'Untitled';
      let message = title + '\n\n';
      if (note.type === 'todo' && note.checklist && note.checklist.length > 0) {
        message += note.checklist
          .map((item) => `${item.completed ? '[x]' : '[ ]'} ${item.text}`)
          .join('\n');
      } else {
        message += note.body || 'No content';
      }
      if (note.reminder) {
        message += `\n\nReminder: ${new Date(note.reminder).toLocaleString()}`;
      }
      await Share.share({ message });
    } catch (error) {
      console.warn('Error sharing note:', error);
      Alert.alert('Error', 'Failed to share the note. Please try again.');
    }
  };

  const showActionMenu = (item) => {
    setSelectedNote(item);
    setActionModalVisible(true);
  };

  const getTags = () => {
    const allTags = notes.reduce((acc, note) => {
      if (note.tags && note.tags.length > 0) {
        note.tags.forEach((tag) => {
          const upperTag = tag.toUpperCase();
          if (!acc.includes(upperTag)) {
            acc.push(upperTag);
          }
        });
      }
      return acc;
    }, []);
    return ['ALL', ...allTags.sort()];
  };

  const addChecklistItem = () => {
    const text = (editingNote.newChecklistItem || '').trim();
    if (!text) return;
    setEditingNote((prev) => ({
      ...prev,
      checklist: [...(prev.checklist || []), { id: uid(), text, completed: false }],
      newChecklistItem: '',
    }));
  };

  const updateChecklistItem = (id, text) => {
    setEditingNote((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.id === id ? { ...item, text } : item
      ),
    }));
  };

  const toggleChecklistItem = (id) => {
    setEditingNote((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }));
  };

  const deleteChecklistItem = (id) => {
    setEditingNote((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((item) => item.id !== id),
    }));
  };

  const handleReminderConfirm = (date) => {
    setEditingNote((prev) => ({ ...prev, reminder: date.getTime() }));
    setDatePickerVisible(false);
  };

  const clearReminder = () => {
    setEditingNote((prev) => ({ ...prev, reminder: null, notificationId: null }));
  };

  const tags = getTags();

  const filtered = notes
    .filter((n) => {
      if (selectedTag !== 'ALL' && (!n.tags || !n.tags.includes(selectedTag))) {
        return false;
      }
      if (!query) return true;
      const q = query.toLowerCase();
      if (n.type === 'todo' && n.checklist && n.checklist.length > 0) {
        return (
          (n.title || '').toLowerCase().includes(q) ||
          n.checklist.some((item) => item.text.toLowerCase().includes(q)) ||
          (n.tags || []).some((tag) => tag.toLowerCase().includes(q))
        );
      }
      return (
        (n.title || '').toLowerCase().includes(q) ||
        (n.body || '').toLowerCase().includes(q) ||
        (n.tags || []).some((tag) => tag.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });

  const leftNotes = filtered.filter((_, index) => index % 2 === 0);
  const rightNotes = filtered.filter((_, index) => index % 2 === 1);

  const renderItem = ({ item }) => {
    console.log('Rendering note:', item); // Debug log
    return (
      <TouchableOpacity style={{ marginBottom: 8 }} activeOpacity={0.9} onPress={() => openEditNote(item)}>
        <View style={[styles.card, item.pinned ? styles.cardPinned : null]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2} ellipsizeMode="tail">
              {item.title || 'Untitled'}
            </Text>
            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  showActionMenu(item);
                }}
                style={styles.actionBtn}
              >
                <MaterialIcons name="more-vert" size={24} color={themeColors.primaryText} />
              </TouchableOpacity>
            </View>
          </View>
          {item.type === 'todo' && item.checklist && item.checklist.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              {item.checklist.slice(0, 3).map((todo, index) => (
                <View key={index} style={styles.checklistItem}>
                  <Text style={styles.checklistCheckbox}>{todo.completed ? '✅' : '⬜'}</Text>
                  <Text
                    style={[styles.cardBody, { flex: 1 }, todo.completed && { textDecorationLine: 'line-through' }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {todo.text}
                  </Text>
                </View>
              ))}
              {item.checklist.length > 3 && (
                <Text style={styles.cardBody}>...and {item.checklist.length - 3} more</Text>
              )}
            </View>
          ) : (
            <Text style={styles.cardBody} numberOfLines={3}>
              {item.body || 'No content yet. Tap to edit.'}
            </Text>
          )}
          {item.reminder && (
            <Text style={styles.cardReminder}>
              Reminder: {new Date(item.reminder).toLocaleString()}
            </Text>
          )}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.cardTags}>
              {item.tags.map((tag, index) => (
                <View key={index} style={styles.cardTag}>
                  <Text style={styles.cardTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.cardFooter}>
            <Text style={styles.footerText}>
              {new Date(item.updatedAt || item.createdAt).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTag = ({ item }) => (
    <TouchableOpacity
      style={[styles.tagButton, selectedTag === item ? styles.tagButtonSelected : null]}
      onPress={() => setSelectedTag(item)}
    >
      <Text style={[styles.tagText, selectedTag === item ? styles.tagTextSelected : null]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderChecklistItem = ({ item, index }) => (
    <View style={styles.checklistItem}>
      <TouchableOpacity onPress={() => toggleChecklistItem(item.id)} style={styles.checklistCheckbox}>
        <Text>{item.completed ? '✅' : '⬜'}</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.checklistInput}
        value={item.text}
        onChangeText={(text) => updateChecklistItem(item.id, text)}
        placeholder="Enter task..."
        placeholderTextColor={placeholderColor}
      />
      <TouchableOpacity onPress={() => deleteChecklistItem(item.id)} style={{ padding: 5 }}>
        <Text style={styles.actionEmoji}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <StatusBar
        barStyle={mode === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: 24 + insets.top }]}>
          <Text style={styles.headerTitle}>🌸 {getGreeting()}</Text>
          <View style={styles.headerRow}>
            <TextInput
              placeholder="Search notes..."
              placeholderTextColor={placeholderColor}
              style={styles.search}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <FlatList
            data={tags}
            renderItem={renderTag}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tagsContainer}
            ListEmptyComponent={<Text style={styles.tagText}>No tags yet</Text>}
          />
        </View>
        <ScrollView style={{flex: 1}} contentContainerStyle={{flexGrow: 1}} ref={scrollRef}>
          {filtered.length === 0 ? (
            <View style={[styles.empty, {flexGrow: 1, justifyContent: 'center'}]}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={styles.emptyText}>No notes yet — tap + to add one!</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1, marginRight: 4, paddingBottom: 60 + insets.bottom + 20 }}>
                  {leftNotes.map(item => renderItem({item}))}
                </View>
                <View style={{ flex: 1, marginLeft: 4, paddingBottom: 60 + insets.bottom + 20 }}>
                  {rightNotes.map(item => renderItem({item}))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.bottomBar, { height: 60 + insets.bottom }]}>
          <View style={{ flex: 1, height: 60, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => {
              scrollRef.current?.scrollTo({ animated: true, y: 0 });
            }}>
              <MaterialIcons name="home" size={28} color={iconColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={openNewNote}>
              <MaterialIcons name="add" size={28} color={iconColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSettingsModalVisible(true)}>
              <MaterialIcons name="settings" size={28} color={iconColor} />
            </TouchableOpacity>
          </View>
        </View>

        <Modal animationType="slide" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editingNote && editingNote.id ? 'Edit Note' : 'New Note'}</Text>
              <TouchableOpacity onPress={saveEditing}>
                <Text style={styles.modalSave}>Save</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TextInput
                ref={titleRef}
                placeholder="Title"
                placeholderTextColor={placeholderColor}
                style={styles.inputTitle}
                value={editingNote ? editingNote.title : ''}
                onChangeText={(t) => setEditingNote((s) => ({ ...s, title: t }))}
                returnKeyType="next"
              />
              <View style={styles.typeToggleContainer}>
                <TouchableOpacity
                  style={[styles.typeButton, editingNote && editingNote.type === 'text' ? styles.typeButtonSelected : null]}
                  onPress={() => setEditingNote((s) => ({ ...s, type: 'text', checklist: [] }))}
                >
                  <Text
                    style={[styles.typeButtonText, editingNote && editingNote.type === 'text' ? styles.typeButtonTextSelected : null]}
                  >
                    Text Note
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, editingNote && editingNote.type === 'todo' ? styles.typeButtonSelected : null]}
                  onPress={() => setEditingNote((s) => ({ ...s, type: 'todo', body: '' }))}
                >
                  <Text
                    style={[styles.typeButtonText, editingNote && editingNote.type === 'todo' ? styles.typeButtonTextSelected : null]}
                  >
                    To-Do List
                  </Text>
                </TouchableOpacity>
              </View>
              {editingNote && editingNote.type === 'todo' ? (
                <>
                  <FlatList
                    data={editingNote.checklist}
                    renderItem={renderChecklistItem}
                    keyExtractor={(item) => item.id}
                    style={{ maxHeight: 200 }}
                  />
                  <View style={styles.checklistItem}>
                    <TextInput
                      style={styles.checklistInput}
                      value={editingNote.newChecklistItem || ''}
                      onChangeText={(t) => setEditingNote((s) => ({ ...s, newChecklistItem: t }))}
                      placeholder="Add new task..."
                      placeholderTextColor={placeholderColor}
                      onSubmitEditing={addChecklistItem}
                      returnKeyType="done"
                    />
                  </View>
                  <TouchableOpacity style={styles.checklistAddButton} onPress={addChecklistItem}>
                    <Text style={styles.checklistAddText}>Add Task</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TextInput
                  placeholder="Write something cute..."
                  placeholderTextColor={placeholderColor}
                  style={styles.inputBody}
                  value={editingNote ? editingNote.body : ''}
                  onChangeText={(t) => setEditingNote((s) => ({ ...s, body: t }))}
                  multiline
                  returnKeyType="next"
                />
              )}
              <TextInput
                placeholder="Tags (comma-separated, e.g., WORK, PERSONAL)"
                placeholderTextColor={placeholderColor}
                style={styles.inputTags}
                value={editingNote ? editingNote.tagsInput : ''}
                onChangeText={(t) => setEditingNote((s) => ({ ...s, tagsInput: t }))}
                returnKeyType="done"
              />
              <View style={styles.pinRow}>
                <TouchableOpacity
                  onPress={() => setEditingNote((s) => ({ ...s, pinned: !s.pinned }))}
                  style={styles.pinBtn}
                >
                  <Text style={styles.pinEmoji}>{editingNote && editingNote.pinned ? '📌' : '📍'}</Text>
                  <Text style={styles.pinText}>{editingNote && editingNote.pinned ? 'Pinned' : 'Pin'}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.reminderRow}>
                <TouchableOpacity onPress={() => setDatePickerVisible(true)} style={styles.reminderBtn}>
                  <Text style={styles.pinEmoji}>🔔</Text>
                  <Text style={styles.reminderText}>
                    {editingNote && editingNote.reminder
                      ? `Reminder: ${new Date(editingNote.reminder).toLocaleString()}`
                      : 'Set Reminder'}
                  </Text>
                </TouchableOpacity>
                {editingNote && editingNote.reminder && (
                  <TouchableOpacity onPress={clearReminder} style={styles.reminderClearBtn}>
                    <Text style={styles.actionEmoji}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="datetime"
              onConfirm={handleReminderConfirm}
              onCancel={() => setDatePickerVisible(false)}
              minimumDate={new Date()}
            />
          </SafeAreaView>
        </Modal>
        <Modal animationType="slide" visible={settingsModalVisible} onRequestClose={() => setSettingsModalVisible(false)}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>⚙️ Settings</Text>
              <View />
            </View>
            <View style={styles.modalBody}>
              <View style={styles.themeToggle}>
                <Text style={styles.themeLabel}>{mode === 'light' ? '☀️ Light Mode' : '🌙 Dark Mode'}</Text>
                <Switch
                  value={mode === 'dark'}
                  onValueChange={toggleMode}
                  trackColor={switchTrackColor}
                  thumbColor={switchThumbColor}
                />
              </View>
              <View style={{ marginTop: 20 }}>
                <Text style={styles.themeLabel}>Color Palette</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={palette}
                    onValueChange={(itemValue) => setPalette(itemValue)}
                    style={{ color: themeColors.primaryText }}
                  >
                    <Picker.Item label="Default" value="default" />
                    <Picker.Item label="Pastel Blue" value="blue" />
                    <Picker.Item label="Pastel Green" value="green" />
                    <Picker.Item label="Pastel Yellow" value="yellow" />
                    <Picker.Item label="Pastel Purple" value="purple" />
                    <Picker.Item label="Pastel Orange" value="orange" />
                  </Picker>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
        <Modal
          visible={actionModalVisible}
          onRequestClose={() => setActionModalVisible(false)}
          animationType="fade"
          transparent={true}
        >
          <TouchableWithoutFeedback onPress={() => setActionModalVisible(false)}>
            <View style={styles.actionModalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.actionModalContent}>
                  {selectedNote && (
                    <>
                      <TouchableOpacity
                        style={styles.actionModalButton}
                        onPress={() => {
                          togglePin(selectedNote.id);
                          setActionModalVisible(false);
                        }}
                      >
                        <MaterialIcons name="push-pin" size={24} color={themeColors.headerText} style={selectedNote.pinned ? { transform: [{ rotate: '45deg' }] } : null} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionModalButton}
                        onPress={() => {
                          shareNote(selectedNote);
                          setActionModalVisible(false);
                        }}
                      >
                        <MaterialIcons name="share" size={24} color={themeColors.headerText} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionModalDeleteButton}
                        onPress={() => {
                          setActionModalVisible(false);
                          setDeleteModalVisible(true);
                        }}
                      >
                        <MaterialIcons name="delete" size={24} color="#FF0000" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
        <Modal
          visible={deleteModalVisible}
          onRequestClose={() => setDeleteModalVisible(false)}
          animationType="fade"
          transparent={true}
        >
          <TouchableWithoutFeedback onPress={() => setDeleteModalVisible(false)}>
            <View style={styles.actionModalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={[styles.actionModalContent, { flexDirection: 'column' }]}>
                  <Text style={styles.actionModalTitle}>Are you sure you want to delete this note?</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
                    <TouchableOpacity
                      style={styles.actionModalCancelButton}
                      onPress={() => setDeleteModalVisible(false)}
                    >
                      <Text style={styles.actionModalCancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionModalDeleteButton}
                      onPress={() => {
                        setDeleteModalVisible(false);
                        deleteNote(selectedNote.id);
                      }}
                    >
                      <Text style={styles.actionModalDeleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

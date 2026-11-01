import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "id";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Meta
    "app.name": "TuneBridge",
    "app.tagline": "Your Music, Woven Together",
    "app.subtitle": "Self-Hosted Music Migration & Library Synchronization",
    "app.selfHosted": "Self-Hosted",
    "app.openStudio": "Open Studio",
    "app.backToLanding": "Back to Landing Page",
    "app.about": "About TuneBridge",
    "app.pagesDemoNotice": "GitHub Pages Demo Mode: Showing interactive simulation. Download local Docker release for real transfers.",

    // Navigation
    "nav.overview": "Overview",
    "nav.transfer": "Transfer & Merge",
    "nav.library": "Library",
    "nav.accounts": "Accounts",
    "nav.activity": "Activity",
    "nav.settings": "Settings",
    "nav.users": "Users",
    "nav.home": "Home",
    "nav.workspace": "Workspace",

    // User & Auth
    "auth.login": "Sign In",
    "auth.register": "Create Account",
    "auth.loginOrRegister": "Sign In / Register",
    "auth.switchAccount": "Switch Account",
    "auth.registered": "Joined",
    "auth.justNow": "Just now",
    "auth.logout": "Sign Out",
    "auth.adminDefault": "Default Admin Account:",
    "auth.adminNotice": "All your migrated playlist and account data is linked to this admin account. Sign in to access your Studio.",
    "auth.protectedTitle": "Protected Studio Access",
    "auth.protectedDesc": "Your music libraries, multi-account credentials, and transfer history are securely stored in your private local vault. Sign in to unlock Studio.",
    "auth.exploreLanding": "Explore Product Features",
    "auth.signedInAs": "Signed in as",
    "auth.sessionClosed": "Your session has ended.",
    "auth.welcomeBack": "Welcome back, {username}!",
    "auth.backHome": "Back to Home",
    "auth.welcomeTitle": "Welcome to TuneBridge",
    "auth.welcomeSubtitle": "Sign in to access your self-hosted music library, playlists, and transfers.",
    "auth.confirmPassword": "Confirm Password",
    "auth.passwordMismatch": "Passwords do not match.",
    "auth.passwordMin": "Password must be at least 6 characters.",
    "auth.usernameMin": "Username must be at least 3 characters.",

    // Users Management (Admin)
    "users.title": "User Management",
    "users.subtitle": "Manage registered user accounts, role permissions, and access privileges.",
    "users.total": "Total Users",
    "users.adminCount": "Administrators",
    "users.regularCount": "Members",
    "users.username": "Username",
    "users.role": "Role",
    "users.connections": "Connections",
    "users.joined": "Joined",
    "users.actions": "Actions",
    "users.delete": "Delete User",
    "users.changeRole": "Toggle Role",
    "users.deleteConfirm": "Are you sure you want to delete user {username}? This will remove all their connected accounts and session data.",
    "users.cantDeleteSelf": "You cannot delete your own active administrator account.",
    "users.cantDeleteRoot": "The root admin account cannot be deleted or demoted.",

    // Overview View
    "overview.bannerTitle": "One Bridge for All Your Music Playlists",
    "overview.bannerDesc": "Seamlessly migrate and merge song collections from multiple YouTube Music accounts to Apple Music, or vice-versa. Private, fast, and free forever.",
    "overview.startTransfer": "Start Transfer & Merge",
    "overview.addAccount": "Add Connection",
    "overview.statConnected": "Active Services",
    "overview.statPlaylists": "Total Playlists",
    "overview.statPlaylistsDesc": "ready to sync & transfer",
    "overview.statActivity": "Activity Logs",
    "overview.statActivityDesc": "workflows completed",
    "overview.connectedAccounts": "Connected Accounts",
    "overview.manageAll": "Manage All",
    "overview.recentActivity": "Recent Activity",
    "overview.viewFullLog": "View Full Log",
    "overview.noActivity": "No transfer history yet.",
    "overview.noActivityDesc": "Run a transfer or merge to record your audit logs here.",
    "overview.noAccounts": "No accounts connected yet.",
    "overview.noAccountsDesc": "Connect your YouTube Music or Apple Music accounts to get started.",

    // Accounts View
    "accounts.title": "Connected Music Accounts",
    "accounts.desc": "Manage multi-account connections for YouTube Music and Apple Music. Your session credentials stay private inside your local vault.",
    "accounts.addNew": "Add New Account",
    "accounts.rename": "Rename",
    "accounts.test": "Test",
    "accounts.testing": "Testing...",
    "accounts.delete": "Delete",
    "accounts.confirmDelete": "Delete this account connection?",
    "accounts.openLibrary": "Open Library",
    "accounts.mobileSync": "Mobile Sync",
    "accounts.connected": "Connected",
    "accounts.disconnected": "Disconnected",
    "accounts.emptyYt": "No YouTube Music accounts added yet.",
    "accounts.emptyApple": "No Apple Music accounts added yet.",

    // Library View
    "library.title": "Playlist Library Explorer",
    "library.desc": "Browse and search all playlists across your connected accounts in one consolidated view.",
    "library.sync": "Sync Library",
    "library.syncing": "Syncing...",
    "library.searchPlaceholder": "Search playlists by title...",
    "library.allAccounts": "All Accounts",
    "library.selectForTransfer": "Select for Transfer",
    "library.empty": "No playlists found matching your search.",
    "library.tracksCount": "{count} tracks",

    // Transfer & Merge Studio
    "transfer.mode1to1": "1:1 Playlist Transfer",
    "transfer.modeMerge": "Multi-Account Collection Merge",
    "transfer.selectSource": "Select Source Playlist",
    "transfer.reviewTracks": "Review Tracks",
    "transfer.sourceTracks": "Source Tracks",
    "transfer.matchStatus": "Match Status",
    "transfer.destinationTracks": "Destination Tracks",
    "transfer.filterAll": "All",
    "transfer.filterExact": "Matched",
    "transfer.filterCovers": "Cover / Alt",
    "transfer.filterUnmatched": "Unmatched",
    "transfer.reMatch": "Re-Match",
    "transfer.executeTransfer": "Execute Transfer",
    "transfer.readyToImport": "Ready to import:",
    "transfer.matchingInProgress": "Matching tracks in background ({current} / {total})...",
    "transfer.autoSaved": "Saved to local draft",
    "transfer.mergeTitle": "Merge Multi-Account Playlists into One Destination",
    "transfer.mergeDesc": "Select playlists from different source accounts (e.g., Personal + Work + Friends). TuneBridge intelligently eliminates duplicates while preserving unique live/remix editions.",
    "transfer.step1": "Step 1: Select Source Playlists",
    "transfer.step2": "Step 2: Destination Account & Options",
    "transfer.generateMerge": "Analyze & Generate Merged Draft",
    "transfer.duplicatesRemoved": "Duplicates removed:",
    "transfer.uniqueFound": "Unique songs found:",

    // Activity View
    "activity.title": "Transfer & Audit History",
    "activity.desc": "Verifiable audit logs for all executed playlist transfers, track matches, and sync workflows.",
    "activity.refresh": "Refresh Logs",
    "activity.searchPlaceholder": "Search by playlist title, source or destination...",
    "activity.filterAll": "All Logs",
    "activity.filterCompleted": "Completed",
    "activity.filterPartial": "Partial",
    "activity.filterFailed": "Failed",
    "activity.empty": "No activity logs match your filter.",

    // Settings View
    "settings.title": "Settings & Diagnostics",
    "settings.desc": "Configure matching engine sensitivity, anti-ban protections, and local endpoint controls.",
    "settings.matchingSection": "Smart Song Matching Engine",
    "settings.matchingDesc": "Multi-stage sanitization, non-Latin script transliteration (Kanji/Hangul/Arabic), and Levenshtein similarity scoring.",
    "settings.networkSection": "Mobile & Local Network Access",
    "settings.networkDesc": "Access TuneBridge on iPhone and Android browsers via your local network. Use bookmarklet to connect accounts in seconds.",
    "settings.copyUrl": "Copy Local URL",
    "settings.copied": "Copied!",

    // Music Player Bar
    "player.preview": "Audio Preview",
    "player.play": "Play",
    "player.pause": "Pause",
    "player.mute": "Mute",
    "player.unmute": "Unmute",

    // Landing Page (Strictly No Raw Tech Stacks / Jargon)
    "landing.badge": "TuneBridge v1.2 • Private Cross-Platform Music Bridge",
    "landing.heroTitle": "Your Music Library. Connected, Clean, and Truly Yours.",
    "landing.heroDesc": "Transfer and merge playlists between YouTube Music and Apple Music directly from your laptop or phone browser. 100% private, self-hosted, with zero cloud tracking.",
    "landing.ctaOpenStudio": "Open Studio",
    "landing.ctaLearnMore": "Explore Features",
    "landing.pillZeroCloud": "Zero Cloud Data Retention",
    "landing.pillPrivateVault": "Encrypted Local Vault",
    "landing.pillMobileReady": "iPhone & Android Ready",

    // Landing Features
    "landing.featuresHeading": "Built for True Music Collectors",
    "landing.featuresSubheading": "Enterprise-grade precision matching with complete privacy and zero monthly fees.",
    "landing.feature1Title": "Cross-Platform Playlist Bridge",
    "landing.feature1Desc": "Move dozens of playlists between YouTube Music and Apple Music without losing your curated order or favorite album versions.",
    "landing.feature2Title": "Non-Latin Script Transliteration",
    "landing.feature2Desc": "Intelligently resolves Japanese Kanji, Korean Hangul, and Cyrillic titles to verified official international catalog releases.",
    "landing.feature3Title": "One-Touch Mobile Sync",
    "landing.feature3Desc": "Connect your music accounts from Safari on iPhone or Chrome on Android with a single tap bookmarklet—no typing sensitive cookies.",
    "landing.feature4Title": "Multi-Account Library Merge",
    "landing.feature4Desc": "Consolidate separate work, family, and personal accounts into a single master playlist with automatic duplicate removal.",
    "landing.feature5Title": "100% Private Local Vault",
    "landing.feature5Desc": "Your session tokens and playlist archives never touch external third-party servers. Everything stays safely on your machine.",
    "landing.feature6Title": "Interactive Audio Preview",
    "landing.feature6Desc": "Audition matched songs in real-time before initiating the transfer to guarantee 100% curation accuracy.",

    // Landing How it works
    "landing.howHeading": "Three Simple Steps to Flawless Sync",
    "landing.howStep1": "1. Connect Your Accounts",
    "landing.howStep1Desc": "Link YouTube Music and Apple Music safely using one-tap browser bookmarklets.",
    "landing.howStep2": "2. Precision Track Matching",
    "landing.howStep2Desc": "Preview every song match with confidence scores, audio snippets, and alternate versions.",
    "landing.howStep3": "3. Seamless Library Export",
    "landing.howStep3Desc": "Create new playlists or append to existing ones with detailed transfer audit logs.",

    // Landing Matrix
    "landing.matrixHeading": "Universal Music Platform Bridge",
    "landing.matrixSubheading": "Designed to weave every music streaming service into one unified experience.",
    "landing.statusActive": "Active & Integrated",
    "landing.statusComingSoon": "Roadmap / Coming Soon",

    // Landing Comparison
    "landing.compHeading": "Why Choose TuneBridge?",
    "landing.compSubheading": "See how TuneBridge compares to traditional cloud-based subscription services.",
    "landing.compPrivacy": "Data Privacy",
    "landing.compPrivacyTuneBridge": "100% Private. Credentials stay exclusively on your own computer.",
    "landing.compPrivacyOthers": "Cloud servers store your sensitive account session credentials.",
    "landing.compPricing": "Cost",
    "landing.compPricingTuneBridge": "Completely free, open-source, with no subscription tiers or track quotas.",
    "landing.compPricingOthers": "$4 - $10/month subscription or strict 500-track limits on free plans.",
    "landing.compMatching": "Title Matching",
    "landing.compMatchingTuneBridge": "Deep sanitization with specialized non-Latin script & live edition protection.",
    "landing.compMatchingOthers": "Generic title string matching often mismatches live & remix recordings.",

    // Landing FAQ
    "landing.faqHeading": "Frequently Asked Questions",
    "landing.faqQ1": "Is TuneBridge safe to use with my music accounts?",
    "landing.faqA1": "Yes. TuneBridge runs entirely as a private local application on your machine. Your credentials and playlists never pass through any cloud intermediary.",
    "landing.faqQ2": "Can I transfer large playlists with thousands of tracks?",
    "landing.faqA2": "Absolutely. TuneBridge includes built-in rate-limiting and anti-ban safeguards designed specifically to handle large libraries smoothly.",
    "landing.faqQ3": "Does TuneBridge support phones like iPhone and Android?",
    "landing.faqA3": "Yes. You can access your local TuneBridge Studio from mobile Safari or Chrome and use the one-tap mobile bookmarklet to connect seamlessly.",

    // Modals & Common UI
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.loading": "Loading...",
    "common.select": "Select",
    "common.search": "Search",
    "common.close": "Close",
    "common.done": "Done",
    "common.tracks": "{count} tracks",
    "common.playlists": "{count} playlists",

    // Header & Mobile Drawer
    "header.about": "About",
    "header.accounts": "Accounts",
    "header.connectionStatus": "Service Connections",
    "header.detected": "playlists detected",
    "header.notConnected": "Not connected",
    "header.connecting": "Connecting...",
    "header.refreshStatus": "Refresh Connection Status",
    "header.disconnectYt": "Disconnect YouTube Music",
    "header.disconnectApple": "Disconnect Apple Music",

    // Modals
    "modal.addAccount": "Add Account Connection",
    "modal.step1": "Step 1/2",
    "modal.step2": "Step 2/2",
    "modal.step1Desc": "Choose service and assign a unique nickname",
    "modal.step2Desc": "Copy script customized for your account",
    "modal.copyBookmarklet": "Copy Bookmarklet Code",
    "modal.copyConsole": "Copy Console Script",
    "modal.openWeb": "Open Web",
    "modal.copyCli": "Copy Terminal Command",
    "modal.saving": "Saving Connection...",
    "modal.saveAccount": "Save Account \"{alias}\"",
    "modal.exportTitle": "Export to {platform}",
    "modal.selectDest": "Select Destination Playlist in {platform}",
    "modal.selectDestWarn": "Please select a destination playlist!",
    "modal.startExport": "Start Export",
    "modal.progressTitle": "Playlist Transfer",
    "modal.syncProgress": "Sync Progress",
    "modal.tracksProcessed": "{current} / {total} tracks processed",
    "modal.successCount": "{success} succeeded · {failed} failed",
    "modal.transferComplete": "Transfer Completed!",
    "modal.injectingSafely": "Injecting songs in safe intervals with anti-ban cooldowns...",
    "modal.searchAlternative": "Search Songs on {platform}",

    // Player & Tracks
    "player.scrubTimeline": "Scrub track timeline",
    "player.closePlayer": "Close Player",
    "track.include": "Include track",
    "track.exclude": "Exclude track",
    "track.notFound": "Track not found",
    "track.replace": "Replace",
    "track.replaceTitle": "Find alternative track match",
    "track.differentArtist": "⚠ Diff Artist",
    "track.lyricsMatched": "✓ Lyrics",
    "track.previewPlay": "Preview 30s audio",
    "track.previewPause": "Pause preview",

    // Sidebar
    "sidebar.collection": "Playlist Collection",
    "sidebar.searchPlaceholder": "Search playlists...",
    "sidebar.loading": "Loading playlists...",
    "sidebar.emptySource": "No playlists found from {platform}. Connect your account first.",
    "sidebar.noMatch": "No playlists match your search.",
  },
  id: {
    // Brand & Meta
    "app.name": "TuneBridge",
    "app.tagline": "Your Music, Woven Together",
    "app.subtitle": "Migrasi & Sinkronisasi Perpustakaan Musik Mandiri",
    "app.selfHosted": "Self-Hosted",
    "app.openStudio": "Buka Studio",
    "app.backToLanding": "Kembali ke Landing Page",
    "app.about": "Tentang TuneBridge",
    "app.pagesDemoNotice": "Mode Demonstrasi GitHub Pages: Menampilkan simulasi studio interaktif. Unduh rilis Docker lokal untuk transfer riil.",

    // Navigation
    "nav.overview": "Ringkasan",
    "nav.transfer": "Transfer & Merge",
    "nav.library": "Perpustakaan",
    "nav.accounts": "Akun",
    "nav.activity": "Aktivitas",
    "nav.settings": "Pengaturan",
    "nav.users": "Pengguna",
    "nav.home": "Beranda",
    "nav.workspace": "Ruang Kerja",

    // User & Auth
    "auth.login": "Masuk Akun",
    "auth.register": "Daftar Akun",
    "auth.loginOrRegister": "Masuk / Daftar",
    "auth.switchAccount": "Ganti Akun",
    "auth.registered": "Terdaftar",
    "auth.justNow": "Baru saja",
    "auth.logout": "Keluar",
    "auth.adminDefault": "Kredensial Administrator Default:",
    "auth.adminNotice": "Seluruh data akun dan playlist lama Anda telah dimigrasikan ke akun admin ini. Masuk dengan akun di atas untuk mengakses Studio.",
    "auth.protectedTitle": "Akses Terproteksi",
    "auth.protectedDesc": "Perpustakaan musik, token multi-akun, dan riwayat migrasi Anda tersimpan aman dan terisolasi di database lokal Anda. Masuk untuk membuka akses ke Studio.",
    "auth.exploreLanding": "Jelajahi Fitur TuneBridge",
    "auth.signedInAs": "Masuk sebagai",
    "auth.sessionClosed": "Sesi akun Anda telah ditutup.",
    "auth.welcomeBack": "Selamat datang kembali, {username}!",
    "auth.backHome": "Kembali ke Beranda",
    "auth.welcomeTitle": "Selamat Datang di TuneBridge",
    "auth.welcomeSubtitle": "Masuk untuk mengakses perpustakaan musik lokal, playlist, dan studio transfer Anda.",
    "auth.confirmPassword": "Konfirmasi Kata Sandi",
    "auth.passwordMismatch": "Kata sandi tidak cocok.",
    "auth.passwordMin": "Kata sandi minimal 6 karakter.",
    "auth.usernameMin": "Username minimal 3 karakter.",

    // Users Management (Admin)
    "users.title": "Manajemen Pengguna",
    "users.subtitle": "Kelola akun pengguna yang terdaftar, hak akses, dan izin per pengguna.",
    "users.total": "Total Pengguna",
    "users.adminCount": "Administrator",
    "users.regularCount": "Pengguna Biasa",
    "users.username": "Nama Pengguna",
    "users.role": "Hak Akses",
    "users.connections": "Koneksi Akun",
    "users.joined": "Terdaftar",
    "users.actions": "Aksi",
    "users.delete": "Hapus Pengguna",
    "users.changeRole": "Ubah Hak Akses",
    "users.deleteConfirm": "Apakah Anda yakin ingin menghapus pengguna {username}? Semua koneksi akun dan data sesi mereka akan dihapus.",
    "users.cantDeleteSelf": "Anda tidak dapat menghapus akun administrator Anda sendiri yang sedang aktif.",
    "users.cantDeleteRoot": "Akun administrator utama (root) tidak dapat dihapus atau diturunkan hak aksesnya.",

    // Overview View
    "overview.bannerTitle": "Satu Jembatan untuk Semua Playlist Anda",
    "overview.bannerDesc": "Gabungkan koleksi lagu dari berbagai akun YouTube Music langsung ke satu akun Apple Music, atau sebaliknya. Mandiri, aman, dan tanpa biaya langganan pihak ketiga.",
    "overview.startTransfer": "Mulai Transfer & Merge",
    "overview.addAccount": "Tambah Koneksi Akun",
    "overview.statConnected": "Koneksi Layanan",
    "overview.statPlaylists": "Total Playlist",
    "overview.statPlaylistsDesc": "koleksi siap digabung",
    "overview.statActivity": "Riwayat Aktivitas",
    "overview.statActivityDesc": "proses selesai",
    "overview.connectedAccounts": "Akun Terhubung",
    "overview.manageAll": "Kelola Semua",
    "overview.recentActivity": "Aktivitas Terbaru",
    "overview.viewFullLog": "Lihat Log Lengkap",
    "overview.noActivity": "Belum ada riwayat transfer.",
    "overview.noActivityDesc": "Lakukan transfer atau merge playlist untuk melihat catatan audit di sini.",
    "overview.noAccounts": "Belum ada akun terhubung.",
    "overview.noAccountsDesc": "Hubungkan akun YouTube Music atau Apple Music Anda untuk memulai.",

    // Accounts View
    "accounts.title": "Koneksi Akun Musik",
    "accounts.desc": "Kelola multi-akun YouTube Music dan Apple Music. Kredensial tersimpan aman dan terisolasi pada vault lokal Anda.",
    "accounts.addNew": "Tambah Akun Baru",
    "accounts.rename": "Ubah Nama",
    "accounts.test": "Uji",
    "accounts.testing": "Menguji...",
    "accounts.delete": "Hapus",
    "accounts.confirmDelete": "Hapus koneksi akun ini?",
    "accounts.openLibrary": "Buka Library",
    "accounts.mobileSync": "Mobile Sync",
    "accounts.connected": "Terhubung",
    "accounts.disconnected": "Terputus",
    "accounts.emptyYt": "Belum ada akun YouTube Music yang ditambahkan.",
    "accounts.emptyApple": "Belum ada akun Apple Music yang ditambahkan.",

    // Library View
    "library.title": "Eksplorasi Library Playlist",
    "library.desc": "Lihat seluruh playlist dari semua akun terhubung dalam satu tempat terpadu.",
    "library.sync": "Sinkronkan Library",
    "library.syncing": "Menyinkronkan...",
    "library.searchPlaceholder": "Cari nama playlist...",
    "library.allAccounts": "Semua Akun",
    "library.selectForTransfer": "Pilih Transfer",
    "library.empty": "Tidak ada playlist yang cocok dengan pencarian Anda.",
    "library.tracksCount": "{count} lagu",

    // Transfer & Merge Studio
    "transfer.mode1to1": "Transfer 1:1",
    "transfer.modeMerge": "Merge Koleksi Multi-Akun",
    "transfer.selectSource": "Pilih Playlist Sumber",
    "transfer.reviewTracks": "Review Lagu",
    "transfer.sourceTracks": "Lagu Sumber",
    "transfer.matchStatus": "Status Kecocokan",
    "transfer.destinationTracks": "Lagu Tujuan",
    "transfer.filterAll": "Semua",
    "transfer.filterExact": "Cocok",
    "transfer.filterCovers": "Cover / Alt",
    "transfer.filterUnmatched": "Belum Ada",
    "transfer.reMatch": "Re-Match",
    "transfer.executeTransfer": "Transfer",
    "transfer.readyToImport": "Siap diekspor:",
    "transfer.matchingInProgress": "Mencocokkan lagu di latar belakang ({current} / {total} lagu)...",
    "transfer.autoSaved": "Otomatis tersimpan",
    "transfer.mergeTitle": "Gabungkan Koleksi Multi-Akun ke Satu Tujuan",
    "transfer.mergeDesc": "Pilih playlist dari berbagai akun sumber (misal: Orang A + Orang B + Orang C), sistem akan mengeliminasi duplikat lagu dengan tetap mempertahankan versi live/remix, lalu memindahkannya ke akun tujuan Anda.",
    "transfer.step1": "Langkah 1: Pilih Playlist dari Akun Sumber",
    "transfer.step2": "Langkah 2: Tentukan Akun Tujuan & Opsi",
    "transfer.generateMerge": "Analisis & Generate Draft Gabungan",
    "transfer.duplicatesRemoved": "Duplikat dieliminasi:",
    "transfer.uniqueFound": "Lagu unik ditemukan:",

    // Activity View
    "activity.title": "Riwayat Aktivitas",
    "activity.desc": "Catatan audit proses transfer dan merge playlist yang pernah dieksekusi.",
    "activity.refresh": "Refresh Riwayat",
    "activity.searchPlaceholder": "Cari berdasarkan judul, akun sumber, atau tujuan...",
    "activity.filterAll": "Semua Log",
    "activity.filterCompleted": "Selesai",
    "activity.filterPartial": "Sebagian",
    "activity.filterFailed": "Gagal",
    "activity.empty": "Tidak ada riwayat yang sesuai filter.",

    // Settings View
    "settings.title": "Pengaturan & Diagnostik",
    "settings.desc": "Konfigurasi algoritma pencocokan lagu, status proteksi anti-ban, dan endpoint mandiri.",
    "settings.matchingSection": "Algoritma Pencocokan Lagu (Matching Engine)",
    "settings.matchingDesc": "Pembersihan sanitasi judul ganda, transliterasi huruf kanji/hangul/arab, dan evaluasi kesamaan berbasis Levenshtein.",
    "settings.networkSection": "Akses Jaringan Lokal & Smartphone",
    "settings.networkDesc": "Akses TuneBridge dari browser iPhone dan Android di jaringan Wi-Fi lokal Anda. Gunakan bookmarklet untuk menghubungkan akun.",
    "settings.copyUrl": "Salin URL Lokal",
    "settings.copied": "Tersalin!",

    // Music Player Bar
    "player.preview": "Audio Preview",
    "player.play": "Putar",
    "player.pause": "Jeda",
    "player.mute": "Bisukan",
    "player.unmute": "Aktifkan Suara",

    // Landing Page
    "landing.badge": "TuneBridge v1.2 • Jembatan Playlist Musik Multi-Platform Pribadi",
    "landing.heroTitle": "Perpustakaan Musik Anda. Tersambung, Bersih, dan Utuh.",
    "landing.heroDesc": "Pindahkan dan gabungkan playlist dari banyak akun YouTube Music ke Apple Music langsung dari browser laptop atau HP Anda. 100% mandiri, aman, dan tanpa biaya langganan pihak ketiga.",
    "landing.ctaOpenStudio": "Buka Studio",
    "landing.ctaLearnMore": "Pelajari Fitur",
    "landing.pillZeroCloud": "100% Bebas Kuota Cloud",
    "landing.pillPrivateVault": "Vault Penyimpanan Lokal Terenkripsi",
    "landing.pillMobileReady": "Akses iPhone & Android Siap",

    // Landing Features
    "landing.featuresHeading": "Dirancang untuk Penikmat Musik Sejati",
    "landing.featuresSubheading": "Akurasi pencocokan lagu tingkat tinggi dengan privasi penuh dan tanpa biaya langganan bulanan.",
    "landing.feature1Title": "Jembatan Playlist Lintas Platform",
    "landing.feature1Desc": "Pindahkan puluhan playlist antara YouTube Music dan Apple Music tanpa kehilangan susunan urutan lagu dan rilisan orisinalnya.",
    "landing.feature2Title": "Transliterasi Judul Non-Latin",
    "landing.feature2Desc": "Mendeteksi judul lagu berbahasa Jepang (Kanji), Korea (Hangul), atau Cyrillic ke nama resmi rilisan katalog internasional.",
    "landing.feature3Title": "Sinkronisasi Satu Sentuhan dari HP",
    "landing.feature3Desc": "Hubungkan akun musik langsung dari Safari di iPhone atau Chrome di Android menggunakan bookmarklet praktis tanpa mengetik token manual.",
    "landing.feature4Title": "Penggabungan Koleksi Multi-Akun",
    "landing.feature4Desc": "Satukan koleksi dari akun kantor, pribadi, maupun teman ke satu playlist utama dengan eliminasi otomatis duplikat lagu.",
    "landing.feature5Title": "100% Vault Lokal Mandiri",
    "landing.feature5Desc": "Kredensial dan arsip playlist Anda tidak pernah dikirim ke server pihak ketiga mana pun. Semua tersimpan di komputer Anda.",
    "landing.feature6Title": "Pemutar Audio Preview Terpadu",
    "landing.feature6Desc": "Dengarkan cuplikan audio langsung sebelum melakukan transfer untuk memastikan kecocokan lagu 100% akurat.",

    // Landing How it works
    "landing.howHeading": "Tiga Langkah Mudah Sinkronisasi",
    "landing.howStep1": "1. Hubungkan Akun Musik Anda",
    "landing.howStep1Desc": "Tautkan akun YouTube Music dan Apple Music menggunakan bookmarklet browser satu sentuhan yang aman.",
    "landing.howStep2": "2. Pencocokan Lagu Presisi",
    "landing.howStep2Desc": "Tinjau kecocokan setiap lagu dengan skor akurasi, cuplikan audio, dan pilihan lagu alternatif.",
    "landing.howStep3": "3. Ekspor ke Perpustakaan",
    "landing.howStep3Desc": "Buat playlist baru atau tambahkan ke playlist yang sudah ada dengan catatan log transfer transparan.",

    // Landing Matrix
    "landing.matrixHeading": "Jembatan Musik Seluruh Platform",
    "landing.matrixSubheading": "Dirancang untuk menyatukan beragam ekosistem layanan musik ke dalam satu kendali terpusat.",
    "landing.statusActive": "Aktif & Terintegrasi",
    "landing.statusComingSoon": "Roadmap / Segera Hadir",

    // Landing Comparison
    "landing.compHeading": "Mengapa Memilih TuneBridge?",
    "landing.compSubheading": "Bandingkan TuneBridge dengan layanan transfer musik komersial berbasis cloud.",
    "landing.compPrivacy": "Privasi Data",
    "landing.compPrivacyTuneBridge": "100% Mandiri. Kredensial dan token hanya tersimpan di komputer Anda sendiri.",
    "landing.compPrivacyOthers": "Server cloud pihak ketiga menyimpan kredensial sesi akun Anda.",
    "landing.compPricing": "Biaya Penggunaan",
    "landing.compPricingTuneBridge": "Gratis sepenuhnya, open source, tanpa kuota lagu dan tanpa langganan.",
    "landing.compPricingOthers": "Biaya langganan Rp 60.000 - Rp 150.000/bulan atau batasan ketat kuota lagu.",
    "landing.compMatching": "Akurasi Pencocokan",
    "landing.compMatchingTuneBridge": "Sanitasi judul mendalam dengan proteksi pembeda versi live, remix, dan cover.",
    "landing.compMatchingOthers": "Pencocokan teks sederhana yang sering tertukar antara lagu rekaman studio dan rekaman live.",

    // Landing FAQ
    "landing.faqHeading": "Pertanyaan yang Sering Diajukan",
    "landing.faqQ1": "Apakah TuneBridge aman untuk akun musik saya?",
    "landing.faqA1": "Sangat aman. TuneBridge beroperasi penuh secara lokal pada perangkat Anda sendiri tanpa server perantara cloud pihak ketiga.",
    "landing.faqQ2": "Apakah bisa mentransfer playlist berukuran ribuan lagu?",
    "landing.faqA2": "Bisa. TuneBridge dilengkapi algoritma rate-limiting bertahap dan proteksi anti-ban agar transfer library besar berjalan lancar tanpa terblokir.",
    "landing.faqQ3": "Apakah TuneBridge bisa digunakan langsung dari smartphone?",
    "landing.faqA3": "Bisa. Anda cukup membuka alamat IP lokal komputer Anda dari browser Safari iPhone atau Chrome Android.",

    // Modals & Common UI
    "common.save": "Simpan",
    "common.cancel": "Batal",
    "common.loading": "Memuat...",
    "common.select": "Pilih",
    "common.search": "Cari",
    "common.close": "Tutup",
    "common.done": "Selesai",
    "common.tracks": "{count} lagu",
    "common.playlists": "{count} playlist",

    // Header & Mobile Drawer
    "header.about": "Tentang",
    "header.accounts": "Akun",
    "header.connectionStatus": "Status Koneksi Layanan",
    "header.detected": "playlist terdeteksi",
    "header.notConnected": "Belum terhubung",
    "header.connecting": "Menghubungkan...",
    "header.refreshStatus": "Refresh Status Koneksi",
    "header.disconnectYt": "Putuskan YouTube Music",
    "header.disconnectApple": "Putuskan Apple Music",

    // Modals
    "modal.addAccount": "Tambah Koneksi Akun",
    "modal.step1": "Langkah 1/2",
    "modal.step2": "Langkah 2/2",
    "modal.step1Desc": "Tentukan layanan dan nama akun terlebih dahulu",
    "modal.step2Desc": "Salin script yang telah disesuaikan dengan akun Anda",
    "modal.copyBookmarklet": "Salin Kode Bookmarklet",
    "modal.copyConsole": "Salin Script Console",
    "modal.openWeb": "Buka Web",
    "modal.copyCli": "Salin Perintah Terminal",
    "modal.saving": "Menyimpan Koneksi...",
    "modal.saveAccount": "Simpan Akun \"{alias}\"",
    "modal.exportTitle": "Ekspor ke {platform}",
    "modal.selectDest": "Pilih Playlist di {platform}",
    "modal.selectDestWarn": "Pilih salah satu playlist tujuan!",
    "modal.startExport": "Mulai Ekspor",
    "modal.progressTitle": "Transfer Playlist",
    "modal.syncProgress": "Progres Sinkronisasi",
    "modal.tracksProcessed": "{current} / {total} lagu diproses",
    "modal.successCount": "{success} berhasil · {failed} gagal",
    "modal.transferComplete": "Transfer Berhasil!",
    "modal.injectingSafely": "Menyuntikkan lagu secara bertahap dengan jeda aman anti-ban...",
    "modal.searchAlternative": "Cari Lagu di {platform}",

    // Player & Tracks
    "player.scrubTimeline": "Geser timeline lagu",
    "player.closePlayer": "Tutup Pemutar",
    "track.include": "Sertakan lagu ini",
    "track.exclude": "Kecualikan lagu ini",
    "track.notFound": "Lagu tidak ditemukan",
    "track.replace": "Ganti",
    "track.replaceTitle": "Cari alternatif lagu lain",
    "track.differentArtist": "⚠ Beda Artis",
    "track.lyricsMatched": "✓ Lirik",
    "track.previewPlay": "Putar cuplikan 30s",
    "track.previewPause": "Jeda cuplikan lagu",

    // Sidebar
    "sidebar.collection": "Koleksi Playlist",
    "sidebar.searchPlaceholder": "Cari nama playlist...",
    "sidebar.loading": "Memuat playlist...",
    "sidebar.emptySource": "Belum ada playlist dari {platform}. Pastikan akun sudah terhubung.",
    "sidebar.noMatch": "Tidak ada playlist yang cocok dengan pencarian.",
  },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tunebridge_lang");
      if (saved === "en" || saved === "id") return saved;
    }
    return "en"; // Default English per user instruction
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("tunebridge_lang", newLang);
      document.documentElement.lang = newLang;
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const t = (key: string, replacements?: Record<string, string | number>): string => {
    const dict = translations[lang] || translations.en;
    let text = dict[key] || translations.en[key] || key;
    if (replacements) {
      for (const [k, v] of Object.entries(replacements)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

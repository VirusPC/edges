# Machenike Mini GTR Ubuntu Dual-Boot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Ops note:** This is a host OS install plan, not application code. Treat each task’s “test” as a **verification command / screenshot checklist**. Do **not** automate Disk Management shrink, firmware boot-order changes, or the Ubuntu partitioner unless the user explicitly overrides the Global Constraints below.

**Goal:** On the Machenike Mini GTR (Windows 11 Home, UEFI/GPT, single 1TB NVMe), install Ubuntu Desktop 24.04 LTS alongside Windows so both OSes boot from the existing EFI System Partition and the user can choose at power-on.

**Architecture:** Keep the current Windows layout intact. Shrink the nearly empty data volume `D:` to create contiguous unallocated space. Write an Ubuntu USB installer on the attached Kingston stick (`E:`). Boot that USB in UEFI mode, install Ubuntu into the unallocated space (ext4 root + optional EFI reuse), and let Ubiquity/ubuntu-desktop-bootstrap install GRUB on the existing EFI partition so the firmware boot menu / GRUB can reach both Windows Boot Manager and Ubuntu. Do not touch `C:` size unless free space on `D:` proves insufficient.

**Tech Stack:** Windows 11 Home 64-bit (10.0.26200); Ubuntu Desktop 24.04.x LTS amd64 ISO; Rufus (GPT / UEFI non-CSM) or balenaEtcher; Windows Disk Management / `diskpart`; UEFI firmware setup; GRUB 2; open-source `amdgpu` for Ryzen 7 255 / Radeon 780M.

**Spec:** Conversation requirements (2026-09-20): dual-boot Linux on 机械师 GTR Mini Win11; prefer Ubuntu over CentOS for desktop dual-boot; Grok Bot may assist prep/checks but must not perform partitioning for the user. Measured inventory on host `cheng-minigtr` (same day):

| Item | Value |
| --- | --- |
| Host label | cheng-minigtr |
| Hardware | Machenike Mini GTR |
| CPU / iGPU | AMD Ryzen 7 255 / Radeon 780M |
| RAM | ~64 GB (66338344960 bytes reported) |
| Disk 0 | YMTC PC41Q-1TB-B NVMe, GPT, ~953.9 GiB |
| Part layout | Recovery ~1 GiB; EFI ~260 MiB; MSR ~16 MiB; `C:` Windows NTFS ~200.6 GiB (~124.6 GiB free); `D:` NTFS ~752.1 GiB (~750.9 GiB free) |
| Disk 1 USB | Kingston DataTraveler 3.0, `E:`, FAT32, ~115.4 GiB (~89.2 GiB free) |
| Firmware | `BiosFirmwareType = Uefi` |
| BitLocker / Secure Boot / Fast Startup | Needs **elevated** re-check in Task 1 (non-admin shell was denied) |

## Global Constraints

- **No bot-driven partitioning:** Agent must not shrink/delete/format Disk 0 partitions, rewrite GPT, or drive the Ubuntu “Something else” partition UI. User performs those clicks. Agent may measure, explain, and verify after.
- **Do not wipe `C:` or the EFI System Partition.** Ubuntu must reuse the existing ESP (do not create a second ESP on the same disk unless the installer forces it and the user accepts).
- **Prefer shrinking `D:`**, not `C:`. Target Ubuntu root size: **128–256 GiB** unless the user picks another size in Task 5.
- **UEFI-only install.** Rufus: Partition scheme GPT, Target system UEFI (non CSM). Never Legacy/CSM-only USB.
- **Windows Home:** no Hyper-V / BitLocker Pro assumptions. Still verify BitLocker status before shrink.
- **Backup before shrink.** At least: confirm `D:` has nothing critical, or copy it off; create a Windows restore point; note firmware “Boot” key (usually F7/F10/F12/Del on Mini PCs).
- **USB `E:` will be erased** when writing the installer. Confirm with the user before Rufus starts.
- **ISO:** Ubuntu Desktop **24.04.x LTS** amd64 from `https://ubuntu.com/download/desktop` (or `releases.ubuntu.com`). Verify SHA256 before flash.
- **Drivers:** Use in-kernel `amdgpu` first; do not install proprietary NVIDIA packages on this iGPU machine.
- **Public notes / edges:** strip Tailscale `100.x`, tokens, and full disk serials before publishing.
- **Co-authored-by** on any edges commit: `IT资产管理 <grok-bot@users.noreply.github.com>`
- **Success definition:** Cold boot shows a boot chooser; Windows still boots and unlocks existing profiles; Ubuntu reaches a desktop, gets network, and `efibootmgr` lists both Windows Boot Manager and ubuntu.

---

## Artifact map

**Create (on Windows / USB / disk)**

- `E:\` Ubuntu installer USB (destructive rewrite of Kingston)
- Unallocated region on Disk 0 after shrinking `D:` (size locked in Task 5)
- Ubuntu `ext4` root (and optional `swap` file inside root — prefer swapfile over swap partition on 64 GB RAM)
- GRUB entries on existing ESP under `\EFI\ubuntu\`

**Read / verify only**

- Disk 0 partition table (Recovery / EFI / MSR / `C:` / `D:`)
- `bcdedit`, `Confirm-SecureBootUEFI`, `manage-bde`, Fast Startup registry (elevated)
- Ubuntu ISO + `.sha256` sum file

**Do not create/commit in this plan’s host work**

- Second ESP on Disk 0
- Deleting Windows Recovery partition “to free space”
- Automating firmware setup clicks without the user at the machine
- CentOS / Rocky / Alma images (rejected for this desktop dual-boot)

---

### Task 1: Elevated safety baseline on Windows

**Files / surfaces:**
- Verify: Disk Management GUI; elevated PowerShell
- Produce: short checklist answers pasted into chat or `D:\dualboot-precheck.txt`

**Interfaces:**
- Consumes: host already reachable via Grok Bot local execution as user `cheng`
- Produces: confirmed BitLocker off-or-suspended, Fast Startup off, Secure Boot on/off noted, firmware is UEFI, free space numbers for Task 5

- [ ] **Step 1: Open elevated PowerShell**

User: Start menu → type `PowerShell` → right-click → Run as administrator.

- [ ] **Step 2: Capture disk and volume state**

```powershell
Get-Disk | Format-Table Number,FriendlyName,PartitionStyle,Size,BusType -AutoSize
Get-Partition -DiskNumber 0 | Format-Table PartitionNumber,DriveLetter,Type,Size -AutoSize
Get-Volume | Format-Table DriveLetter,FileSystemLabel,FileSystem,Size,SizeRemaining -AutoSize
```

Expected: Disk 0 GPT; `C:` and `D:` present; Kingston as another disk with `E:` if plugged in.

- [ ] **Step 3: BitLocker status**

```powershell
manage-bde -status C:
manage-bde -status D:
```

Expected: Protection Status **Protection Off**, or user explicitly suspends protection before shrink (`manage-bde -protectors -disable C:` only if it was On). If On, stop and decrypt/suspend before Task 5.

- [ ] **Step 4: Secure Boot and firmware type**

```powershell
Confirm-SecureBootUEFI
Get-ComputerInfo | Select-Object BiosFirmwareType,SecureBootState | Format-List
```

Expected: `BiosFirmwareType : Uefi`. Record Secure Boot True/False for Task 6 (Ubuntu 24.04 usually works with Secure Boot on).

- [ ] **Step 5: Disable Fast Startup**

```powershell
powercfg /h off
Set-ItemProperty -LiteralPath 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Power' -Name HiberbootEnabled -Value 0 -Type DWord
```

Verify:

```powershell
powercfg /a
Get-ItemProperty -LiteralPath 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Power' -Name HiberbootEnabled
```

Expected: hibernation unavailable or off; `HiberbootEnabled = 0`.

- [ ] **Step 6: Write precheck file**

```powershell
@"
date=$(Get-Date -Format o)
bitlocker_C=<paste>
bitlocker_D=<paste>
secure_boot=<paste>
fast_startup=0
proposed_ubuntu_GiB=160
"@ | Set-Content -Encoding utf8 D:\dualboot-precheck.txt
```

- [ ] **Step 7: Verification gate**

User pastes `D:\dualboot-precheck.txt` (or agent reads it with local Shell). Do not continue if BitLocker is On or firmware is not UEFI.

---

### Task 2: Backup and rollback anchors

**Files / surfaces:**
- Windows restore point; optional copy of anything important on `D:`
- Note firmware boot-menu key on paper/phone

**Interfaces:**
- Consumes: Task 1 precheck passed
- Produces: restore point exists; user knows how to boot Windows USB/recovery if GRUB fails

- [ ] **Step 1: Confirm `D:` contents are disposable or backed up**

```powershell
Get-ChildItem D:\ -Force | Select-Object Name,Length,LastWriteTime | Format-Table -AutoSize
```

If anything matters, copy to external disk first.

- [ ] **Step 2: Create restore point (elevated)**

```powershell
Checkpoint-Computer -Description 'Before Ubuntu dual-boot' -RestorePointType MODIFY_SETTINGS
Get-ComputerRestorePoint | Select-Object -Last 3
```

Expected: new restore point listed.

- [ ] **Step 3: Confirm Windows installation media strategy**

Minimum: know that Win11 recovery partition still exists (Task 1 disk list showed Recovery ~1 GiB). Optional: Microsoft Media Creation Tool on a second USB. Not required to proceed if Recovery partition is healthy.

- [ ] **Step 4: Verification gate**

User confirms: “`D:` OK to shrink; restore point created; I know F12/Del for firmware.”

---

### Task 3: Download Ubuntu ISO and verify checksum

**Files:**
- Create: `D:\iso\ubuntu-24.04.3-desktop-amd64.iso` (exact point release may differ; use current 24.04.x desktop amd64 name from the site)
- Create: `D:\iso\SHA256SUMS` (or the single checksum string from the download page)

**Interfaces:**
- Consumes: ~6 GiB free on `D:` (available)
- Produces: verified ISO path for Rufus

- [ ] **Step 1: Create folder**

```powershell
New-Item -ItemType Directory -Force -Path D:\iso | Out-Null
```

- [ ] **Step 2: Download Desktop 24.04 LTS ISO**

Browser: open `https://ubuntu.com/download/desktop` → download 24.04 LTS desktop amd64 into `D:\iso\`.

Agent alternative (user-approved):

```powershell
# Example URL — replace with the exact current 24.04.x desktop link from releases.ubuntu.com
Invoke-WebRequest -Uri 'https://releases.ubuntu.com/24.04/ubuntu-24.04.3-desktop-amd64.iso' -OutFile 'D:\iso\ubuntu-24.04.3-desktop-amd64.iso'
Invoke-WebRequest -Uri 'https://releases.ubuntu.com/24.04/SHA256SUMS' -OutFile 'D:\iso\SHA256SUMS'
```

- [ ] **Step 3: Verify SHA256**

```powershell
cd D:\iso
Get-FileHash .\ubuntu-24.04.3-desktop-amd64.iso -Algorithm SHA256
Select-String -Path .\SHA256SUMS -Pattern 'ubuntu-24.04.3-desktop-amd64.iso'
```

Expected: hash strings match exactly.

- [ ] **Step 4: Verification gate**

If hash mismatches, delete ISO and re-download. Do not flash a bad image.

---

### Task 4: Write UEFI installer to Kingston `E:`

**Files:**
- Modify: entire Kingston disk (destructive)
- Tool: Rufus from `https://rufus.ie/` (portable OK)

**Interfaces:**
- Consumes: verified ISO; user consent to wipe `E:`
- Produces: UEFI-bootable Ubuntu USB

- [ ] **Step 1: User confirms wipe**

Explicit confirmation: “Erase Kingston `E:` and write Ubuntu installer.”

- [ ] **Step 2: Launch Rufus as admin and set**

- Device: Kingston DataTraveler (`E:`)
- Boot selection: the verified ISO
- Partition scheme: **GPT**
- Target system: **UEFI (non CSM)**
- File system: FAT32 (Rufus default for ISO DD/ISO mode — follow Rufus recommendation for this ISO)
- Start → wait until ready

- [ ] **Step 3: Verify Windows still sees a USB volume (may remount with different label)**

```powershell
Get-Volume | Format-Table DriveLetter,FileSystemLabel,FileSystem,Size -AutoSize
Get-Disk | Format-Table Number,FriendlyName,PartitionStyle,BusType -AutoSize
```

Expected: Kingston still present; no change to Disk 0 layout.

- [ ] **Step 4: Verification gate**

Rufus status ready; Disk 0 untouched.

---

### Task 5: Shrink `D:` to create unallocated space (user-driven)

**Files / surfaces:**
- Windows Disk Management (`diskmgmt.msc`)
- Disk 0 partition 5 (`D:`)

**Interfaces:**
- Consumes: Task 1–2 passed; chosen size (default **160 GiB** ≈ 163840 MB)
- Produces: contiguous **Unallocated** space at end of `D:` (or adjacent) large enough for Ubuntu

- [ ] **Step 1: Lock the size with the user**

Default proposal: shrink `D:` by **160 GiB**, leaving ~590 GiB NTFS on `D:`. Alternatives: 128 GiB (minimum comfortable) or 256 GiB (dev + docker heavy).

- [ ] **Step 2: User opens Disk Management**

`Win+X` → Disk Management → select `D:` → Shrink Volume.

- [ ] **Step 3: Enter shrink amount in MB**

For 160 GiB: enter `163840` (160 × 1024). Complete shrink.

Agent must **not** click Shrink for the user.

- [ ] **Step 4: Verify unallocated region**

```powershell
Get-Partition -DiskNumber 0 | Format-Table PartitionNumber,DriveLetter,Type,Size -AutoSize
# GUI: Disk 0 should show a black Unallocated block ≈ chosen size
```

Expected: `D:` smaller; Unallocated ≈ requested size; `C:` and EFI unchanged.

- [ ] **Step 5: Verification gate**

If shrink fails (immovable files), try: disable pagefile temporarily on `D:` if any, reboot, retry shrink, or shrink a smaller amount. Do not delete Recovery to force space.

---

### Task 6: Firmware boot to USB (user at machine)

**Files / surfaces:**
- UEFI setup / Boot Menu on Mini GTR

**Interfaces:**
- Consumes: Rufus USB; Secure Boot note from Task 1
- Produces: Ubuntu live session started in UEFI mode

- [ ] **Step 1: Insert Kingston, reboot**

- [ ] **Step 2: Enter Boot Menu**

Try `F7` / `F10` / `F12` / `Esc` / `Del` during POST (Mini GTR manuals often use `F7` or `F12` for boot device; `Del` for setup). Pick the entry that looks like **UEFI: Kingston…**, not legacy/USB-HDD CSM.

- [ ] **Step 3: If USB does not appear**

Enter firmware setup → disable Fast Boot if present → confirm UEFI mode → optionally disable Secure Boot only if USB/ISO refuses to start → save → retry.

- [ ] **Step 4: In GRUB/USB menu choose “Try or Install Ubuntu”**

- [ ] **Step 5: Verification gate (live session)**

In live terminal:

```bash
ls /sys/firmware/efi
efibootmgr -v || true
lsblk -o NAME,SIZE,FSTYPE,TYPE,MOUNTPOINTS,MODEL
```

Expected: `/sys/firmware/efi` exists (UEFI boot). `lsblk` shows NVMe with a large unallocated gap matching Task 5.

If `/sys/firmware/efi` is missing, you booted CSM/legacy — stop and redo USB/firmware as UEFI.

---

### Task 7: Install Ubuntu into unallocated space

**Files / surfaces:**
- Ubuntu installer (24.04 desktop bootstrap / ubiquity)
- Disk 0 unallocated region; existing ESP

**Interfaces:**
- Consumes: live UEFI session; unallocated space
- Produces: Ubuntu root filesystem + GRUB on ESP

- [ ] **Step 1: Start Install Ubuntu**

- [ ] **Step 2: Keyboard, network (optional but useful), normal install**

- [ ] **Step 3: Disk screen — choose manual partitioning**

Prefer **Manual / Something else** (wording varies by installer generation):

- Select the **free/unallocated** space → add partition → size = all free → type **ext4** → mount point `/`
- **Do not format** the existing EFI partition; set it as **EFI System Partition** / “Use as EFI” **without** format if the installer asks
- No separate swap partition required (64 GB RAM); use swapfile later if desired
- Device for bootloader installation: the NVMe disk (e.g. `/dev/nvme0n1`), not the USB

If the installer offers **Install alongside Windows** and clearly shows it will use only the unallocated space, that is acceptable; still verify the summary screen before Continue.

- [ ] **Step 4: Create user account and finish**

- [ ] **Step 5: When told to reboot, remove USB**

- [ ] **Step 6: Verification gate**

First reboot reaches either GRUB (Ubuntu + Windows entries) or firmware boot order landing in one OS with the other still listed in `efibootmgr`.

---

### Task 8: Prove dual-boot both ways

**Files / surfaces:**
- GRUB menu; Windows login; Ubuntu desktop

**Interfaces:**
- Consumes: completed install
- Produces: signed-off dual-boot

- [ ] **Step 1: Boot Ubuntu, check EFI entries**

```bash
efibootmgr -v
lsblk -f
cat /etc/os-release
```

Expected: `ubuntu` and `Windows Boot Manager` entries; root is ext4 on the former free space; `PRETTY_NAME` is Ubuntu 24.04.x.

- [ ] **Step 2: Reboot into Windows from GRUB**

Expected: Windows loads user profiles; `C:` and shrunk `D:` healthy in Explorer.

- [ ] **Step 3: From Windows, confirm Disk 0**

```powershell
Get-Partition -DiskNumber 0 | Format-Table PartitionNumber,DriveLetter,Type,Size -AutoSize
```

Expected: new Linux partition(s) visible as type without a Windows letter (or as Healthy primary without letter); EFI unchanged in size.

- [ ] **Step 4: Verification gate**

Both OS boots succeed once each. If Windows missing from GRUB: from Ubuntu `sudo os-prober && sudo update-grub` (enable os-prober in `/etc/default/grub` if needed on 24.04).

---

### Task 9: Ubuntu post-install hardening for this hardware

**Files:**
- Modify: `/etc/default/grub` only if os-prober needed
- Optional: `sudo fallocate` swapfile; `amdgpu` stays default

**Interfaces:**
- Consumes: working Ubuntu desktop + network
- Produces: updated system; optional NTFS mounts read-only or rw; Timeshift optional

- [ ] **Step 1: Update**

```bash
sudo apt update && sudo apt full-upgrade -y
```

- [ ] **Step 2: Confirm GPU**

```bash
lspci | grep -i vga
glxinfo -B 2>/dev/null | head -n 20 || sudo apt install -y mesa-utils && glxinfo -B | head -n 20
```

Expected: AMD/Radeon; mesa/`amdgpu` stack. Do **not** install NVIDIA proprietary drivers.

- [ ] **Step 3: Optional swapfile (if hibernation not needed)**

```bash
free -h
# only if you want a safety swapfile despite 64 GB RAM:
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo swapon -a
free -h
```

- [ ] **Step 4: Optional: mount Windows `C:` read-only**

```bash
sudo mkdir -p /mnt/windows
sudo mount -o ro /dev/nvme0n1p4 /mnt/windows   # confirm partition number with lsblk -f first
ls /mnt/windows/Users
```

- [ ] **Step 5: Verification gate**

`uname -a` works; no NVIDIA packages installed (`dpkg -l | grep -i nvidia` empty or only unrelated libs).

---

### Task 10: Failure recovery card (keep this plan section handy)

**Files:** none created unless disaster

- [ ] **Step 1: If firmware only boots Windows**

Firmware Boot Menu → pick `ubuntu`; or Setup → Boot Order → move ubuntu above Windows.

- [ ] **Step 2: If GRUB is broken**

Boot Ubuntu USB → Try Ubuntu →

```bash
sudo mount /dev/nvme0n1pX /mnt          # X = ubuntu root
sudo mount /dev/nvme0n1pY /mnt/boot/efi # Y = EFI
sudo mount --bind /dev /mnt/dev
sudo mount --bind /proc /mnt/proc
sudo mount --bind /sys /mnt/sys
sudo chroot /mnt
grub-install /dev/nvme0n1
update-grub
exit
sudo reboot
```

Replace `pX` / `pY` using `lsblk -f` (never guess).

- [ ] **Step 3: If Windows refuses to boot**

Firmware → Windows Boot Manager; or WinRE from Recovery partition; last resort: repair BCD from Windows installation media.

- [ ] **Step 4: Verification gate**

Document which recovery path was tested (even if only read-through).

---

## Self-review

1. **Spec coverage:** Dual-boot Ubuntu on Mini GTR Win11 — Tasks 1–9. Prefer Ubuntu not CentOS — Global Constraints. Bot must not partition — Global Constraints + Task 5/7 wording. Use existing Kingston USB — Task 4. Shrink empty-ish `D:` not system `C:` — Architecture + Task 5. AMD 780M drivers — Task 9.
2. **Placeholder scan:** No TBD/TODO; ISO point-release filename may be `24.04.3` or newer — steps say to replace with the exact name from the download page / SHA256SUMS.
3. **Consistency:** Default shrink size 160 GiB used in Task 1 precheck template and Task 5; ESP reuse required in Task 7; UEFI checks in Tasks 1, 4, 6.

## Execution notes for agents

- Safe for agent: Task 1 measurement (non-destructive), Task 3 download/hash if user approves, Task 8–9 verification commands, reading `D:\dualboot-precheck.txt`.
- User-only: Rufus Start, Disk Management Shrink, firmware boot menu, Ubuntu partition confirmation Continuue/Install Now.
- Stop and ask if BitLocker is On, if shrink would touch `C:`, or if live session is not EFI.

import os

POSSIBLE_PATHS = [
    r"C:\Program Files",
    r"C:\Program Files (x86)",
    r"C:\ProgramData",
    os.path.expandvars(r"%APPDATA%"),
    os.path.expandvars(r"%LOCALAPPDATA%"),
]

KEYWORDS = ["primocache", "romex", "l2cache"]  # nomes, não lógica interna

def scan_filesystem():
    findings = []

    for base_path in POSSIBLE_PATHS:
        if not os.path.exists(base_path):
            continue

        for root, dirs, files in os.walk(base_path):
            for name in dirs + files:
                lower = name.lower()
                if any(k in lower for k in KEYWORDS):
                    findings.append(os.path.join(root, name))

    return findings

if __name__ == "__main__":
    results = scan_filesystem()

    if results:
        print("[+] Rastros encontrados:")
        for r in results:
            print("  -", r)
    else:
        print("[-] Nenhum rastro encontrado.")

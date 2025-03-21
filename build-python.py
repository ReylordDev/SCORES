import PyInstaller.__main__ as pyinstaller

controller_path = "./src_py/controller.py"


def main():
    pyinstaller.run([controller_path, "--noconfirm", "--python-option", "X utf8"])


if __name__ == "__main__":
    main()

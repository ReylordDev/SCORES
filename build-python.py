import PyInstaller.__main__ as pyinstaller

controller_path = "./src-py/controller.py"


def main():
    pyinstaller.run(
        [
            controller_path,
            "--noconfirm",
        ]
    )


if __name__ == "__main__":
    main()

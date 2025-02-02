import re
import cairosvg
from PIL import Image


# Function to extract CSS variables from the :root selector in a CSS file
def extract_css_variables(css_file):
    with open(css_file, "r") as file:
        css_content = file.read()

    # Regex to find the :root block and extract variables within it
    root_match = re.search(r":root\s*{([^}]+)}", css_content, re.DOTALL)

    if not root_match:
        return {}

    root_content = root_match.group(1)

    # Regex to extract variable name and value from the :root block
    variables = re.findall(r"--([a-zA-Z0-9\-]+)\s*:\s*([^;]+);", root_content)
    return {name: value.strip() for name, value in variables}


# Function to create SVG based on index and CSS variables
def create_svg(css_variables, index, output_file):
    svg_template = """
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="{background}"
        stroke-width="1"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle
          cx="7.2"
          cy="14.4"
          r="6"
          fill="{color1}"
        />
        <circle
          cx="16.8"
          cy="14.4"
          r="6"
          fill="{color2}"
        />
        <circle
          cx="12"
          cy="7.2"
          r="6"
          fill="{color3}"
        />
      </svg>
    """

    # Determine circle colors based on the index
    if index % 3 == 0:
        color1 = css_variables["accent"]
        color2 = css_variables["secondary"]
        color3 = css_variables["primary"]
    elif index % 3 == 1:
        color1 = css_variables["primary"]
        color2 = css_variables["accent"]
        color3 = css_variables["secondary"]
    else:
        color1 = css_variables["secondary"]
        color2 = css_variables["primary"]
        color3 = css_variables["accent"]

    # Format the SVG with the correct colors and background
    svg_content = svg_template.format(
        background=css_variables["background"],
        color1=color1,
        color2=color2,
        color3=color3,
    )

    # Write the SVG content to a file
    with open(output_file, "w") as file:
        file.write(svg_content)

    print(f"SVG file created: {output_file}")


# Define the CSS file path
css_file_path = "./src/index.css"

# Extract CSS variables
css_variables = extract_css_variables(css_file_path)


# Function to convert SVG to PNG
def svg_to_png(svg_file, png_file, width=1024, height=1024):
    cairosvg.svg2png(
        url=svg_file, write_to=png_file, output_width=width, output_height=height
    )
    print(f"PNG file created: {png_file}")


# Create SVG file for a specific index
index = 0  # For example, index can be any integer
output_svg_file = "./assets/icons/icon.svg"
linux_icon_file = "./assets/icons/icon.png"
windows_icon_file = "./assets/icons/icon.ico"

create_svg(css_variables, index, output_svg_file)

# Linux Icon
svg_to_png(output_svg_file, "./assets/icons/icon.png", 512, 512)

# Windows Icon
img = Image.open(linux_icon_file)
icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
img.save(windows_icon_file, sizes=icon_sizes)

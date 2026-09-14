with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Marker 1: end of viewpointGameTabsBar
marker_tabs_end = '    </div>\n\n    <!-- Featured Gaming Showcase (Left Main Banners + Right Area Real Game Cards) -->'

# Marker 2: start of game-arena
marker_arena_start = '    <!-- Main Game Box -->\n    <div class="game-arena">'

# Marker 3: end of game-arena
marker_arena_end = '        </div>\n\n      </section>\n\n    </div>'

idx1 = content.find(marker_tabs_end)
if idx1 == -1:
    print("Marker 1 not found!")
    exit(1)
tabs_end_pos = idx1 + len('    </div>\n')

idx2 = content.find(marker_arena_start)
if idx2 == -1:
    print("Marker 2 not found!")
    exit(1)

idx3 = content.find(marker_arena_end, idx2)
if idx3 == -1:
    print("Marker 3 not found!")
    exit(1)
arena_end_pos = idx3 + len(marker_arena_end)

# Extract parts
before_showcase = content[:tabs_end_pos]
showcase_block = content[tabs_end_pos:idx2].strip()
game_arena_block = content[idx2:arena_end_pos].strip()
after_arena = content[arena_end_pos:]

# Construct reordered HTML:
# Category Nav -> Game Tabs -> Game Arena (ZERO SCROLLING NEEDED!) -> Showcase / Carousel / Trending -> Rest
new_content = (
    before_showcase + "\n" +
    game_arena_block + "\n\n" +
    showcase_block + "\n" +
    after_arena
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully reordered index.html so game arena is right below game tabs!")

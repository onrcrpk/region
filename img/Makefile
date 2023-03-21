ALL_FILES = $(patsubst %.svg, %.png, $(wildcard *.svg))
MARKER_FILES = $(patsubst %.svg, %.png, $(wildcard markers/*.svg))
FAVICON_FILES = favicon-60.png favicon-76.png favicon-120.png favicon-152.png

all: $(ALL_FILES) $(MARKER_FILES) $(FAVICON_FILES)

clean:
	- gvfs-trash $(ALL_FILES)

%-200.png : %-200.svg
	inkscape --export-png=$@ --export-area-page --without-gui --export-background-opacity=0.0 -w 200 -h 200 $<

%-32.png : %-32.svg
	inkscape --export-png=$@ --export-area-page --without-gui --export-background-opacity=0.0 -w 32 -h 32 $<

%-24.png : %-24.svg
	inkscape --export-png=$@ --export-area-page --without-gui --export-background-opacity=0.0 -w 24 -h 24 $<

%-16.png : %-16.svg
	inkscape --export-png=$@ --export-area-page --without-gui --export-background-opacity=0.0 -w 16 -h 16 $<

markers/%-14.png : markers/%-14.svg
	inkscape --export-png=$@ --export-area-drawing --without-gui --export-background-opacity=0.0 -w 14 -h 14 $<

markers/%-12.png : markers/%-12.svg
	inkscape --export-png=$@ --export-area-drawing --without-gui --export-background-opacity=0.0 -w 12 -h 12 $<

%.png : %.svg
	inkscape --export-png=$@ --export-area-page --without-gui --export-background-opacity=0.0 -w 14 -h 14 $<

favicon-60.png: touch-icon.svg
	inkscape --export-png=$@ --export-area-page --without-gui --export-background-opacity=0.0 -w 60 -h 60 $<

favicon-76.png: touch-icon.svg
	inkscape --export-png=$@ --export-area-page --without-gui --export-background-opacity=0.0 -w 76 -h 76 $<

favicon-120.png: touch-icon.svg
	inkscape --export-png=$@ --export-area-page --without-gui --export-background-opacity=0.0 -w 120 -h 120 $<

favicon-152.png: touch-icon.svg
	inkscape --export-png=$@ --export-area-page --without-gui --export-background-opacity=0.0 -w 152 -h 152 $<

PNG_FILES = $(wildcard *.png)
crush: crushed $(patsubst %.png, crushed/%.png, $(PNG_FILES))

crushed:
	mkdir crushed

crushed/%.png: %.png
	pngcrush -brute $< $@

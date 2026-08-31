DRAFT := draft-behring-cvd-policy-00
SOURCE := draft-behring-cvd-policy.md
BUILD := build
XML := $(BUILD)/$(DRAFT).xml
TXT := $(BUILD)/$(DRAFT).txt
HTML := $(BUILD)/$(DRAFT).html

KRAMDOWN_RFC_VERSION := 1.7.43
ERB_VERSION := 6.0.7
XML2RFC_VERSION := 3.34.0
GEM_HOME := $(CURDIR)/.gems
KRAMDOWN_RFC := $(GEM_HOME)/bin/kramdown-rfc
TOOLS_STAMP := $(GEM_HOME)/.installed-$(KRAMDOWN_RFC_VERSION)

.PHONY: all check check-core check-draft check-spec clean tools

all: $(XML)
	cd "$(BUILD)" && uvx --from "xml2rfc==$(XML2RFC_VERSION)" xml2rfc --v3 --strict --text --html "$(DRAFT).xml"
	test -s "$(TXT)" -a -s "$(HTML)"

$(XML): $(SOURCE) | tools $(BUILD)
	GEM_HOME="$(GEM_HOME)" GEM_PATH="$(GEM_HOME)" "$(KRAMDOWN_RFC)" --v3 "$(SOURCE)" > "$(XML).tmp"
	mv "$(XML).tmp" "$(XML)"

$(BUILD):
	mkdir -p "$(BUILD)"

tools: $(TOOLS_STAMP)

$(TOOLS_STAMP):
	mkdir -p $(GEM_HOME)
	gem install --install-dir $(GEM_HOME) --no-document erb -v $(ERB_VERSION)
	gem install --install-dir $(GEM_HOME) --no-document kramdown-rfc -v $(KRAMDOWN_RFC_VERSION)
	touch "$(TOOLS_STAMP)"

check: check-draft check-spec check-core
	$(MAKE) clean all
	xmllint --noout "$(XML)"
	git -C .. diff --check
	git -C .. diff --exit-code -- "draft/$(XML)" "draft/$(TXT)" "draft/$(HTML)"

check-draft:
	node scripts/check-draft.mjs

check-spec:
	npm --prefix .. test
	npm --prefix .. run test:v1

check-core:
	./scripts/check-core-reference.sh

clean:
	rm -f $(BUILD)/$(DRAFT).xml $(BUILD)/$(DRAFT).txt $(BUILD)/$(DRAFT).html

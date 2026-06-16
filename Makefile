SHELL := /bin/bash

.PHONY: deploy
deploy:
	rm -rf _site
	npm run build
	scp -r _site/* andu@shh.puzl.ing:/srv/puzlinghome/

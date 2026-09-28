SHELL := /bin/bash

.PHONY: deploy
deploy:
	rm -rf _site/*
	npm run build
	rsync -av --delete-delay _site/ andu@shh.puzl.ing:/srv/puzlinghome/

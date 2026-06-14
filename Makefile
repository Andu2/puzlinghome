SHELL := /bin/bash
.PHONY: deploy

deploy:
	scp index.html andu@shh.puzl.ing:/srv/puzlinghome/index.html

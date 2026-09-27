SHELL := /bin/bash

.PHONY: deploy
deploy:
	rm -rf _siteprod
	npm run buildprod
	rsync -av --delete-delay _siteprod/ andu@shh.puzl.ing:/srv/puzlinghome/

.PHONY stats
stats:
	

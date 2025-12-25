#!/bin/bash

./config.sh --url https://github.com/${GITHUB_REPO} \
            --token ${RUNNER_TOKEN} \
            --name "fly-${FLY_REGION:-unknown}" \
            --labels "self-hosted,fly,${FLY_REGION:-unknown}" \
            --unattended \
            --replace

./run.sh
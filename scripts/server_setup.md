# folders
mkdir /finance_manager_application
mkdir /finance_manager_application/logs
chmod -R 777 finance_manager_application

# setup python 13 in .venv folder on root

# db scripts
## copy postgres.sh to /finance_manager_application/postgres and run it
## run steps in postgres file to create finance_manager db
## copy db_manager.py and config file to finance_manager_application/postgres and run the python script


# ssh
## generate ssh key on local machine
```commandline
ssh-keygen -t ed25519 -C "github_actions_deploy" -f ~/.ssh/github_action_deploy
```


## copy public key to server
```commandline
ssh-copy-id -i ~/.ssh/github_action_deploy.pub root@31.57.224.242
```

### alternative - add contents of following file to ~/.ssh/authorized_keys
```commandline
cat ~/.ssh/github_actions_deploy_key.pub
```

### copy private key conents to github server (SSH_PRIVATE_KEY secret)
cat ~/.ssh/github_actions_deploy


### SSH_USERNAME = root (server username)

### while copying private key to github secret, do not have any line break after last line
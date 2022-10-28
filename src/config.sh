#!/bin/bash -x
yum -y update
yum -y install unzip
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install --update
amazon-linux-extras install -y lamp-mariadb10.2-php7.2 php7.2
yum install -y httpd
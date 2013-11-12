NEJPublisher
============
通过esprima解析出AST，混淆后，通过escodegen生成代码
前端发布工具
============
以下步骤以windows为例子
1.安装<a target="_blank" href="http://www.nodejs.org/">nodejs</a>
以及安装<a target="_blank" href="https://npmjs.org/">npm</a>包管理工具

2.安装grunt-cli到全局
打开cmd命令行输入
npm install -g grunt-cli

3.命令行输入npm install grunt-contrib-nejpublisher，路径不限定
此步骤需要安装的grunt插件已经安装完成，你可以在自己项目新建Gruntfile文件来(以远程任务或者插件形式或者你自己喜欢的形式)管理自己的任务(grunt学习站点：<a target="_blank" href="http://www.gruntjs.org/article/getting_started.html">http://www.gruntjs.org/article/getting_started.html</a>)PS：或者参照下面的办法完成打包或者皮肤的合并功能。

打包功能：
	a.拷贝release.conf到你的项目去，路径不限定

	b.在命令行中，切换到
	grunt-contrib-nejpublisher所在的目录，在此目录下执行如下命令：
	grunt dopublish --root=D:/workspace/works/grunt-pulgin-test/
	(其中，“root=”后跟随的路径为release.conf文件所在的目录)

	c.以后要打包其他项目，先配置你的release.conf，
	直接在grunt-contrib-nejpublisher所在的目录执行命令，
	也可以写批处理文件：(以下用E盘举例)
		E:
		cd E:/workspace/node_modules/grunt-contrib-nejpublisher
		grunt dopublish --root=E:/workspace/works/grunt-pulgin-test/

皮肤合并功能：
	a.你需要配置xxx.conf，可以参考skin.conf文件
	
	b.命令行下切换到grunt-contrib-nejpublisher所在的目录，在此目录下执行如下命令：
	grunt doskinmerge --dir=D:/workspace/skin.conf
NEJPublisher
============
通过esprima解析出AST，混淆后，通过escodegen生成代码
前端发布工具
============
1.安装nodejs以及npm包管理工具

2.安装grunt-cli到全局
npm install -g grunt-cli

3.安装npm install grunt-contrib-nejpublisher，路径不限定

4.拷贝release.conf到你的项目去，路径不限定

5.在命令行中，切换到
grunt-contrib-nejpublisher所在的目录，在此目录下执行如下命令：
grunt dopublish --root=D:/workspace/works/grunt-pulgin-test/
(其中，“root=”后跟随的路径为release.conf文件所在的目录)

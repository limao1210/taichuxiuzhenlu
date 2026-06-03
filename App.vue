<script>
	const UPDATE_URL = 'http://xxxx/app/version.json'

	function checkUpdate() {
		// #ifdef APP-PLUS
		if (!plus || !plus.runtime) return

		uni.request({
			url: UPDATE_URL,
			success: (res) => {
				const data = res.data
				if (!data || !data.versionCode) return

				const currentCode = plus.runtime.versionCode
				if (data.versionCode <= currentCode) return

				const isForce = data.forceUpdate
				const content = `发现新版本 ${data.versionName}（当前 ${plus.runtime.version}）\n\n${data.updateLog || ''}${isForce ? '\n\n此版本必须更新。' : ''}`

				uni.showModal({
					title: '版本更新',
					content,
					confirmText: '立即更新',
					cancelText: isForce ? '' : '稍后',
					showCancel: !isForce,
					success: (modalRes) => {
						if (modalRes.confirm || isForce) {
							downloadAndInstall(data.downloadUrl)
						}
					}
				})
			},
			fail: () => {
				// 静默失败，不打扰
			}
		})
		// #endif
	}

	function downloadAndInstall(url) {
		uni.showLoading({ title: '下载中...', mask: true })
		const task = plus.downloader.createDownload(url, {
			filename: '_doc/update.apk'
		}, (downloadRes, status) => {
			uni.hideLoading()
			if (status !== 200) {
				uni.showToast({ title: '下载失败，请重试', icon: 'none' })
				return
			}
			uni.showModal({
				title: '下载完成',
				content: '是否立即安装？',
				confirmText: '安装',
				success: (mRes) => {
					if (mRes.confirm) {
						plus.runtime.install(downloadRes.filename, { force: true }, () => {
							console.log('安装成功，重启中')
						}, (err) => {
							uni.showToast({ title: '安装失败：' + err.message, icon: 'none' })
						})
					}
				}
			})
		})
		task.start()
	}

	export default {
		onLaunch: function() {
			console.log('App Launch')
			// #ifdef APP-PLUS
			setTimeout(checkUpdate, 2000)
			// #endif
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	html, body, #app, page {
		background-color: #0b1020;
	}
</style>

Imports Miracom.Stat
Imports Miracom.Stat.StatGlobalVariable

Namespace Histogram

    Public Class clsHistogram

#Region "Properties Implementation"

        Private m_pParentControl As SPCHistogram = Nothing
        Private m_rcDrawRegion As Rectangle = Rectangle.Empty
        Private m_rcTitleRegion As Rectangle = Rectangle.Empty
        Private m_dXAxisMin As Double = DOUBLE_NULL_DATA
        Private m_dXAxisMax As Double = DOUBLE_NULL_DATA
        Private m_iYAxisMin As Integer = INTEGER_NULL_DATA
        Private m_iYAxisMax As Integer = INTEGER_NULL_DATA

        Public ReadOnly Property ParentControl() As SPCHistogram
            Get
                Return m_pParentControl
            End Get
        End Property

        Public Property DrawRegion() As Rectangle
            Get
                Return m_rcDrawRegion
            End Get
            Set(ByVal Value As Rectangle)
                If m_rcDrawRegion.Equals(Value) = False Then
                    m_rcDrawRegion = Value
                End If
            End Set
        End Property

        Public Property TitleRegion() As Rectangle
            Get
                Return m_rcTitleRegion
            End Get
            Set(ByVal Value As Rectangle)
                If m_rcTitleRegion.Equals(Value) = False Then
                    m_rcTitleRegion = Value
                End If
            End Set
        End Property

        Public Property XAxisMin() As Double
            Get
                Return m_dXAxisMin
            End Get
            Set(ByVal Value As Double)
                If m_dXAxisMin.Equals(Value) = False Then
                    m_dXAxisMin = Value
                End If
            End Set
        End Property

        Public Property XAxisMax() As Double
            Get
                Return m_dXAxisMax
            End Get
            Set(ByVal Value As Double)
                If m_dXAxisMax.Equals(Value) = False Then
                    m_dXAxisMax = Value
                End If
            End Set
        End Property

        Public Property YAxisMin() As Integer
            Get
                Return m_iYAxisMin
            End Get
            Set(ByVal Value As Integer)
                If m_iYAxisMin.Equals(Value) = False Then
                    m_iYAxisMin = Value
                End If
            End Set
        End Property

        Public Property YAxisMax() As Integer
            Get
                Return m_iYAxisMax
            End Get
            Set(ByVal Value As Integer)
                If m_iYAxisMax.Equals(Value) = False Then
                    m_iYAxisMax = Value
                End If
            End Set
        End Property

#End Region

#Region "Functions Implementation"

        Public Sub New(ByRef pParentControl As SPCHistogram)

            Try
                SetParentControl(pParentControl)

            Catch ex As Exception
                MsgBox("clsHistogram.New()" & vbCrLf & ex.Message, MsgBoxStyle.Critical)
            End Try

        End Sub

        Public Sub SetParentControl(ByRef pParentControl As SPCHistogram)

            Try
                m_pParentControl = pParentControl

            Catch ex As Exception
                MsgBox("clsHistogram.SetParentControl()" & vbCrLf & ex.Message, MsgBoxStyle.Critical)
            End Try

        End Sub

        Public Function DrawChart(ByRef g As Graphics, ByVal rcDraw As Rectangle) As Boolean

            Try
                If ParentControl.GetDataCount() < 1 Or ParentControl.DataSet.IsCalComplete = False Then
                    Return False
                End If

                If ParentControl.IsPrinting = True Then
                    g.DrawRectangle(New Pen(Color.Black), rcDraw)
                Else
                    g.FillRectangle(New SolidBrush(ParentControl.BGColor), rcDraw)
                End If

                If SetupRegion(g, rcDraw) = False Then Return False
                If DrawTitle(g, rcDraw) = False Then Return False
                If DrawXAxis(g) = False Then Return False
                If DrawYAxis(g) = False Then Return False
                If DrawBar(g) = False Then Return False
                If ParentControl.IsViewNormalLine = True Then
                    If DrawNormalLine(g) = False Then Return False
                End If
                If ParentControl.IsView3sLine = True Then
                    If Draw3sLine(g) = False Then Return False
                End If
                If ParentControl.IsViewSpecLimit = True Then
                    If DrawSpecLine(g) = False Then Return False
                End If
                If ParentControl.IsViewBarFreqText = True Then
                    If DrawBarFreq(g) = False Then Return False
                End If

                Return True

            Catch ex As Exception
                MsgBox("clsHistogram.DrawChart()" & vbCrLf & ex.Message, MsgBoxStyle.Critical)
                Return False
            End Try

        End Function

        Public Function SetupRegion(ByRef g As Graphics, ByVal rcDraw As Rectangle) As Boolean

            Try
                Dim ptLocation As Point = New Point(rcDraw.Left + CHART_LEFT_GAP_PIXELS, _
                    rcDraw.Top + CHART_TOP_GAP_PIXELS)
                Dim szSize As Size = New Size(rcDraw.Right - ptLocation.X - CHART_RIGHT_GAP_PIXELS, _
                    rcDraw.Height - ptLocation.Y - CHART_BOTTOM_GAP_PIXELS + rcDraw.Top)
                DrawRegion = New Rectangle(ptLocation, szSize)
                g.FillRectangle(Brushes.White, DrawRegion)

                Return True

            Catch ex As Exception
                MsgBox("clsHistogram.SetupRegion()" & vbCrLf & ex.Message, MsgBoxStyle.Critical)
                Return False
            End Try

        End Function

        Public Function DrawTitle(ByRef g As Graphics, ByVal rcDraw As Rectangle) As Boolean

            Try
                Dim ptLocation As Point = New Point(rcDraw.Left + CHART_BORDER_PIXELS, _
                    rcDraw.Top + CHART_BORDER_PIXELS)
                Dim szSize As Size = New Size(rcDraw.Right - ptLocation.X - CHART_BORDER_PIXELS, _
                    rcDraw.Height - ptLocation.Y - CHART_BORDER_PIXELS * 2 + rcDraw.Top)
                TitleRegion = New Rectangle(ptLocation, szSize)

                Dim fmtTitle As StringFormat = New StringFormat
                If ParentControl.MainTitle <> STRING_NULL_DATA Then
                    fmtTitle.LineAlignment = StringAlignment.Near
                    fmtTitle.Alignment = StringAlignment.Center
                    g.DrawString(ParentControl.MainTitle, _
                        ParentControl.Font, _
                        New SolidBrush(Color.FromArgb(123, 25, 25)), _
                        TitleRegion.Left + TitleRegion.Width / 2.0, _
                        TitleRegion.Top, _
                        fmtTitle)
                End If

                If ParentControl.BottomTitle <> STRING_NULL_DATA Then
                    fmtTitle.LineAlignment = StringAlignment.Center
                    fmtTitle.Alignment = StringAlignment.Center
                    g.DrawString(ParentControl.BottomTitle, _
                        ParentControl.Font, _
                        New SolidBrush(Color.FromArgb(123, 25, 25)), _
                        TitleRegion.Left + TitleRegion.Width / 2.0, _
                        TitleRegion.Bottom - 2, _
                        fmtTitle)
                End If

                If ParentControl.LeftTitle <> STRING_NULL_DATA Then
                    fmtTitle.FormatFlags = StringFormatFlags.DirectionVertical
                    fmtTitle.LineAlignment = StringAlignment.Center
                    fmtTitle.Alignment = StringAlignment.Center
                    g.DrawString(ParentControl.LeftTitle, _
                        ParentControl.Font, _
                        New SolidBrush(Color.FromArgb(123, 25, 25)), _
                        TitleRegion.Left + 5, _
                        TitleRegion.Top + TitleRegion.Height / 2.0, _
                        fmtTitle)
                End If

                Return True

            Catch ex As Exception
                MsgBox("clsHistogram.DrawTitle()" & vbCrLf & ex.Message, MsgBoxStyle.Critical)
                Return False
            End Try

        End Function

        Public Function DrawXAxis(ByRef g As Graphics) As Boolean

            Try
                Dim iBinMeshSize As Integer = ParentControl.DataSet.BinMesh.Count

                If ParentControl.IsXAxisAutoInterval = True Then
                    XAxisMin = ParentControl.DataSet.BinMesh(0)
                    XAxisMax = ParentControl.DataSet.BinMesh(iBinMeshSize - 1)

                    If ParentControl.IsView3sLine = True Then
                        Dim dLowerSigma As Double = ParentControl.DataSet.Mean - ParentControl.DataSet.StdDev * 3
                        Dim dUpperSigma As Double = ParentControl.DataSet.Mean + ParentControl.DataSet.StdDev * 3
                        XAxisMin = Math.Min(XAxisMin, dLowerSigma)
                        XAxisMax = Math.Max(XAxisMax, dUpperSigma)
                    End If

                    If ParentControl.IsViewSpecLimit = True Then
                        If ParentControl.Target <> DOUBLE_NULL_DATA Then
                            XAxisMin = Math.Min(XAxisMin, ParentControl.Target)
                            XAxisMax = Math.Max(XAxisMax, ParentControl.Target)
                        End If
                        If ParentControl.LSL <> DOUBLE_NULL_DATA Then
                            XAxisMin = Math.Min(XAxisMin, ParentControl.LSL)
                            XAxisMax = Math.Max(XAxisMax, ParentControl.LSL)
                        End If
                        If ParentControl.USL <> DOUBLE_NULL_DATA Then
                            XAxisMin = Math.Min(XAxisMin, ParentControl.USL)
                            XAxisMax = Math.Max(XAxisMax, ParentControl.USL)
                        End If
                    End If

                    While (ParentControl.DataSet.BinMesh(0) < XAxisMin)
                        XAxisMin -= ParentControl.DataSet.BinWidth
                    End While

                    While (ParentControl.DataSet.BinMesh(iBinMeshSize - 1) > XAxisMax)
                        XAxisMax += ParentControl.DataSet.BinWidth
                    End While
                Else
                    XAxisMin = ParentControl.XAxisMin
                    XAxisMax = ParentControl.XAxisMax
                End If

                Dim dRegionWidth As Double = DrawRegion.Width
                Dim dRegionHeight As Double = DrawRegion.Height
                Dim ptOrigin As Point = New Point(DrawRegion.Left, DrawRegion.Bottom)

                Dim iXPos As Integer = 0
                Dim iYPos As Integer = 0
                Dim iMaxTextSize As Integer = 0
                Dim szText As SizeF
                Dim i As Integer

                iYPos = DrawRegion.Bottom
                For i = 0 To iBinMeshSize - 1
                    Dim sXAxis As String = CType(ParentControl.DataSet.BinMesh(i), Double).ToString(ParentControl.PrecisionFormat)
                    szText = g.MeasureString(sXAxis, ParentControl.Font)
                    iMaxTextSize = Math.Max(iMaxTextSize, szText.Width)
                Next i

                Dim iPrevXPos As Integer = 0
                Dim iPassCount As Integer = 0

                For i = 0 To iBinMeshSize - 1
                    Dim dBinMesh As Double = ParentControl.DataSet.BinMesh(i)
                    iXPos = ptOrigin.X + CInt(((dBinMesh - XAxisMin) * dRegionWidth) / (XAxisMax - XAxisMin))
                    If i > 0 Then
                        If iXPos - iPrevXPos > iMaxTextSize + 5 Then
                            Exit For
                        End If
                    End If
                    If i = 0 Then
                        iPrevXPos = iXPos
                    End If
                    iPassCount += 1
                Next i

                Dim strFormat As StringFormat = New StringFormat
                strFormat.Alignment = StringAlignment.Center
                strFormat.LineAlignment = StringAlignment.Near

                ' ±¸°£°ª Ç¥½Ã
                Dim iCount As Integer = 0
                For i = 0 To iBinMeshSize - 1
                    Dim dBinMesh As Double = ParentControl.DataSet.BinMesh(i)
                    iXPos = ptOrigin.X + CInt(((dBinMesh - XAxisMin) * dRegionWidth) / (XAxisMax - XAxisMin))
                    If iXPos < DrawRegion.Left Then
                        GoTo NEXT_FOR
                    End If
                    If iXPos > DrawRegion.Right Then
                        GoTo NEXT_FOR
                    End If
                    If iCount Mod iPassCount = 0 Then
                        g.DrawLine(Pens.Black, iXPos, iYPos + 3, iXPos, iYPos)
                        Dim sXAxis As String = dBinMesh.ToString(ParentControl.PrecisionFormat)
                        g.DrawString(sXAxis, ParentControl.Font, Brushes.Black, iXPos, iYPos + 5, strFormat)
                    End If
                    iCount += 1
NEXT_FOR:
                Next i

                szText = g.MeasureString("TEXT", ParentControl.Font)

                If ParentControl.IsViewSpecLimit = True And ParentControl.IsView3sLine = True Then
                    iYPos = iYPos + 8 + szText.Height * 3
                Else
                    If ParentControl.IsViewSpecLimit = False And ParentControl.IsView3sLine = False Then
                        iYPos = iYPos + 8 + szText.Height
                    Else
                        iYPos = iYPos + 8 + szText.Height * 2
                    End If
                End If

                g.DrawLine(Pens.Black, DrawRegion.Left - 20, iYPos, DrawRegion.Right + 20, iYPos)

                iMaxTextSize = 0
                iPrevXPos = 0
                iPassCount = 0
                Dim dXInterval As Double = (XAxisMax - XAxisMin) / CDbl(CHART_Y_SCALE_STEP)
                For i = 0 To CHART_Y_SCALE_STEP
                    Dim dXAxis As Double = XAxisMin + dXInterval * i
                    szText = g.MeasureString(dXAxis.ToString(ParentControl.PrecisionFormat), ParentControl.Font)
                    iMaxTextSize = Math.Max(iMaxTextSize, szText.Width)
                Next i
                For i = 0 To CHART_Y_SCALE_STEP
                    Dim dXAxis As Double = XAxisMin + dXInterval * i
                    iXPos = ptOrigin.X + CInt(((dXAxis - XAxisMin) * dRegionWidth) / (XAxisMax - XAxisMin))
                    If i > 0 Then
                        If iXPos - iPrevXPos > iMaxTextSize + 5 Then
                            Exit For
                        End If
                    End If
                    If i = 0 Then
                        iPrevXPos = iXPos
                    End If
                    iPassCount += 1
                Next i
                iCount = 0
                For i = 0 To CHART_Y_SCALE_STEP
                    Dim dXAxis As Double = XAxisMin + dXInterval * i
                    iXPos = ptOrigin.X + CInt(((dXAxis - XAxisMin) * dRegionWidth) / (XAxisMax - XAxisMin))
                    If iCount Mod iPassCount = 0 Then
                        g.DrawLine(Pens.Black, iXPos, iYPos + 3, iXPos, iYPos)
                        Dim sXAxis As String = dXAxis.ToString(ParentControl.PrecisionFormat)
                        g.DrawString(sXAxis, ParentControl.Font, Brushes.Black, iXPos, iYPos + 5, strFormat)
                    End If
                    iCount += 1
                Next i

                Return True

            Catch ex As Exception
                MsgBox("clsHistogram.DrawXAxis()" & vbCrLf & ex.Message, MsgBoxStyle.Critical)
                Return False
            End Try

        End Function

        Public Function DrawYAxis(ByRef g As Graphics) As Boolean

            Dim dMaxValue As Double = DOUBLE_NULL_DATA
            Try
                YAxisMin = 0
                If StatBasic.GetMaxValue(ParentControl.DataSet.FreqData, dMaxValue) = False Then Return False
                YAxisMax = CInt(dMaxValue)
                If ParentControl.IsYAxisAutoInteval = True Then
                    While (YAxisMax Mod 5 <> 0)
                        YAxisMax += 1
                    End While
                Else
                    YAxisMin = ParentControl.YAxisMin
                    YAxisMax = ParentControl.YAxisMax
                End If

                If YAxisMax < ParentControl.YAxisInterval Then
                    YAxisMax = ParentControl.YAxisInterval
                End If

                Dim dRegionWidth As Double = DrawRegion.Width
                Dim dRegionHeight As Double = DrawRegion.Height
                Dim ptOrigin As Point = New Point(DrawRegion.Left, DrawRegion.Bottom)

                g.DrawLine(Pens.Black, ptOrigin.X, CInt(ptOrigin.Y - dRegionHeight), ptOrigin.X, ptOrigin.Y)
                g.DrawLine(Pens.Black, ptOrigin.X + CInt(dRegionWidth), ptOrigin.Y - CInt(dRegionHeight), ptOrigin.X + CInt(dRegionWidth), ptOrigin.Y + 1)

                Dim iXPos As Integer = 0
                Dim iYPos As Integer = 0
                Dim iYInterval As Integer = 0
                Dim iStep As Integer = 0

                If ParentControl.YAxisInterval > 0 Then
                    iYInterval = ParentControl.YAxisInterval
                    iStep = CInt((YAxisMax - YAxisMin) / iYInterval)
                Else
                    If YAxisMax < 10 Then
                        iStep = YAxisMax
                    Else
                        iStep = CHART_Y_SCALE_STEP
                    End If
                    If iStep = 0 Then
                        iStep = CHART_Y_SCALE_STEP
                    End If
                    iYInterval = CInt((YAxisMax - YAxisMin) / iStep)
                End If

                iXPos = ptOrigin.X

                Dim iYValue As Integer = 0
                Dim i As Integer
                Dim fmtYAxis As StringFormat = New StringFormat(StringFormatFlags.DirectionRightToLeft)
                fmtYAxis.LineAlignment = StringAlignment.Near
                fmtYAxis.Alignment = StringAlignment.Near

                For i = 0 To iStep
                    iYValue = YAxisMin + iYInterval * i
                    iYPos = ptOrigin.Y - CInt(((iYValue - YAxisMin) * dRegionHeight) / (YAxisMax - YAxisMin))
                    g.DrawLine(Pens.Black, iXPos - 3, iYPos, iXPos, iYPos)

                    If i > 0 And ParentControl.IsViewGridLine = True Then
                        Dim penGrid As Pen = New Pen(Color.FromArgb(230, 230, 230), 1)
                        penGrid.DashStyle = Drawing2D.DashStyle.Dot
                        g.DrawLine(penGrid, iXPos + 1, iYPos, iXPos + CInt(dRegionWidth), iYPos)
                    End If

                    Dim sYAxis As String = iYValue.ToString("#,##0")
                    Dim szText As SizeF = g.MeasureString(sYAxis, ParentControl.Font)
                    g.DrawString(sYAxis, ParentControl.Font, Brushes.Black, iXPos - 5, iYPos - CInt(szText.Height / 2.0), fmtYAxis)
                Next i

                Return True

            Catch ex As Exception
                MsgBox("clsHistogram.DrawYAxis()" & vbCrLf & ex.Message, MsgBoxStyle.Critical)
                Return False
            End Try

        End Function

        Public Function DrawBar(ByRef g As Graphics) As Boolean

            Try
                Dim dRegionWidth As Double = DrawRegion.Width
                Dim dRegionHeight As Double = DrawRegion.Height
                Dim ptOrigin As Point = New Point(DrawRegion.Left, DrawRegion.Bottom)
                Dim rcBar As Rectangle = Rectangle.Empty
                Dim iBarLeft, iBarRight, iBarTop, iBarBottom As Integer
                Dim dFirstXPos As Double = 0
                Dim dNextXPos As Double = 0
                Dim dYPos As Double = 0
                Dim dFirstXPixel As Double = 0
                Dim dNextXPixel As Double = 0
                Dim dYPixel As Double = 0
                Dim iBinMeshSize As Integer = ParentControl.DataSet.BinMesh.Count
                Dim i As Integer

                For i = 0 To iBinMeshSize - 2
                    dFirstXPos = ParentControl.DataSet.BinMesh(i)
                    dNextXPos = ParentControl.DataSet.BinMesh(i + 1)
                    dYPos = CDbl(ParentControl.DataSet.FreqData(i))
                    dFirstXPixel = (dFirstXPos - XAxisMin) * dRegionWidth / (XAxisMax - XAxisMin)
                    dNextXPixel = (dNextXPos - XAxisMin) * dRegionWidth / (XAxisMax - XAxisMin)
                    dYPixel = (dYPos - YAxisMin) * dRegionHeight / (YAxisMax - YAxisMin)

                    If dYPixel <= 0 Then
                        GoTo NEXT_FOR
                    End If

                    ' »ç°¢Çü ÇÏ³ªÀÇ ¿µ¿ª
                    If DrawRegion.Left > DrawRegion.Left + CInt(dFirstXPixel) Then
                        iBarLeft = DrawRegion.Left
                    Else
                        If DrawRegion.Right < DrawRegion.Left + CInt(dFirstXPixel) Then
                            iBarLeft = DrawRegion.Right
                        Else
                            iBarLeft = DrawRegion.Left + CInt(dFirstXPixel)
                        End If
                    End If
                    If DrawRegion.Right < DrawRegion.Left + CInt(dNextXPixel) Then
                        iBarRight = DrawRegion.Right
                    Else
                        If DrawRegion.Left > DrawRegion.Left + CInt(dNextXPixel) Then
                            iBarRight = DrawRegion.Left
                        Else
                            iBarRight = DrawRegion.Left + CInt(dNextXPixel)
                        End If
                    End If
                    If DrawRegion.Top > DrawRegion.Bottom - CInt(dYPixel) Then
                        iBarTop = DrawRegion.Top
                    Else
                        iBarTop = DrawRegion.Bottom - CInt(dYPixel)
                    End If
                    iBarBottom = DrawRegion.Bottom

                    rcBar = New Rectangle(iBarLeft, iBarTop, iBarRight - iBarLeft, iBarBottom - iBarTop)
                    g.FillRectangle(New SolidBrush(ParentControl.BarColor), rcBar)
                    g.DrawRectangle(New Pen(CHART_BAR_REGION), rcBar)
NEXT_FOR:
                Next i

                g.DrawLine(Pens.Black, ptOrigin.X, ptOrigin.Y, ptOrigin.X + CInt(dRegionWidth), ptOrigin.Y)

                Return True

            Catch ex As Exception
                MsgBox("clsHistogram.DrawBar()" & vbCrLf & ex.Message, MsgBoxStyle.Critical)
                Return False
            End Try

        End Function

        Public Function DrawBarFreq(ByRef g As Graphics) As Boolean

            Try
                Dim dRegionWidth As Double = DrawRegion.Width
                Dim dRegionHeight As Double = DrawRegion.Height
                Dim ptOrigin As Point = New Point(DrawRegion.Left, DrawRegion.Bottom)
                Dim iBarLeft, iBarRight, iBarTop, iBarBottom As Integer
                Dim dFirstXPos As Double = 0
                Dim dNextXPos As Double = 0
                Dim dFirstXPixel As Double = 0
                Dim dNextXPixel As Double = 0
                Dim iXPos As Integer = 0
                Dim iYPos As Integer = 0
                Dim iValue As Integer = 0
                Dim iBinMeshSize As Integer = ParentControl.DataSet.BinMesh.Count
                Dim i As Integer

                Dim fmtFreqText As StringFormat = New StringFormat
                fmtFreqText.LineAlignment = StringAlignment.Center
                fmtFreqText.Alignment = StringAlignment.Center

                For i = 0 To iBinMeshSize - 2
                    dFirstXPos = ParentControl.DataSet.BinMesh(i)
                    dNextXPos = ParentControl.DataSet.BinMesh(i + 1)
                    dFirstXPixel = (dFirstXPos - m_dXAxisMin) * dRegionWidth / (m_dXAxisMax - m_dXAxisMin)
                    dNextXPixel = (dNextXPos - m_dXAxisMin) * dRegionWidth / (m_dXAxisMax - m_dXAxisMin)

                    If DrawRegion.Left + dFirstXPixel < DrawRegion.Left Then
                        GoTo NEXT_FOR
                    End If
                    If (DrawRegion.Left + dNextXPixel > DrawRegion.Right) Then
                        GoTo NEXT_FOR
                    End If

                    If (DrawRegion.Left > DrawRegion.Left + dFirstXPixel) Then
                        iBarLeft = DrawRegion.Left
                    Else
                        iBarLeft = DrawRegion.Left + CInt(dFirstXPixel)
                    End If

                    If (DrawRegion.Right < DrawRegion.Left + dNextXPixel) Then
                        iBarRight = DrawRegion.Right
                    Else
                        iBarRight = DrawRegion.Left + CInt(dNextXPixel)
                    End If

                    iValue = ParentControl.DataSet.FreqData(i)

                    iYPos = ptOrigin.Y - CInt((iValue - YAxisMin) * dRegionHeight / (YAxisMax - YAxisMin))
                    If iYPos < DrawRegion.Top Then
                        iYPos = DrawRegion.Top
                    End If
                    If iYPos > DrawRegion.Bottom Then
                        iYPos = DrawRegion.Bottom
                    End If
                    Dim sValue As String = iValue.ToString("#,##0")
                    Dim szText As SizeF = g.MeasureString(sValue, ParentControl.Font)
                    iBarTop = iYPos - szText.Height
                    iBarBottom = iYPos

                    Dim rcText As RectangleF = New RectangleF(iBarLeft, iBarTop, iBarRight - iBarLeft, iBarBottom - iBarTop)
                    g.DrawString(sValue, ParentControl.Font, Brushes.Black, rcText, fmtFreqText)
NEXT_FOR:
                Next i

                Return True

            Catch ex As Exception
                MsgBox("clsHistogram.DrawBarFreq()" & vbCrLf & ex.Message, MsgBoxStyle.Critical)
                Return False
            End Try

        End Function

        Public Function DrawSpecLine(ByRef g As Graphics) As Boolean

            Try
                Dim dRegionWidth As Double = DrawRegion.Width
                Dim dRegionHeight As Double = DrawRegion.Height
                Dim ptOrigin As Point = New Point(DrawRegion.Left, DrawRegion.Bottom)
                Dim dUSL As Double = ParentControl.USL
                Dim dLSL As Double = ParentControl.LSL
                Dim dTarget As Double = ParentControl.Target
                Dim penSpecLine As Pen = New Pen(CHART_SPEC_LINE_COLOR, 1)
                Dim sValue As String = STRING_NULL_DATA
                Dim szText As SizeF = SizeF.Empty
                Dim rcText As RectangleF = RectangleF.Empty
                Dim iXPos As Integer = 0
                Dim iXPos2 As Integer = 0
                Dim iYPos As Integer = 0
                Dim iTargetPos1, iUSLPos1, iLSLPos1 As Integer
                Dim iTargetPos2, iUSLPos2, iLSLPos2 As Integer
                Dim iTPos1, iUPos1, iLPos1 As Integer
                Dim iTPos2, iUPos2, iLPos2 As Integer
                iTargetPos1 = 0
                iUSLPos1 = 0
                iLSLPos1 = 0
                iTargetPos2 = 0
                iUSLPos2 = 0
                iLSLPos2 = 0
                iTPos1 = 0
                iUPos1 = 0
                iLPos1 = 0
                iTPos2 = 0
                iUPos2 = 0
                iLPos2 = 0

                Dim fmtSpecLimit As StringFormat = New StringFormat
                fmtSpecLimit.Alignment = StringAlignment.Center
                fmtSpecLimit.LineAlignment = StringAlignment.Near

                iYPos = ptOrigin.Y

                If dTarget <> DOUBLE_NULL_DATA Then
                    iXPos = ptOrigin.X + CInt(((dTarget - XAxisMin) * dRegionWidth) / (XAxisMax - XAxisMin))
                    If iXPos > DrawRegion.Left - 20 And iXPos < DrawRegion.Right + 20 Then
                        penSpecLine.Color = CHART_TARGET_LINE_COLOR
                        g.DrawLine(penSpecLine, iXPos, iYPos, iXPos, iYPos - CInt(dRegionHeight + 10))
                        szText = g.MeasureString("T", ParentControl.Font)
                        iTPos1 = iXPos - szText.Width / 2.0
                        iTPos2 = iXPos + szText.Width / 2.0
                        rcText = New RectangleF(iXPos - CInt(szText.Width / 2.0), _
                            iYPos - CInt(dRegionHeight + 10 + szText.Height), _
                            szText.Width, _
                            szText.Height)
                        'g.FillRectangle(Brushes.WhiteSmoke, rcText)
                        g.DrawString("Target", ParentControl.Font, New SolidBrush(CHART_TARGET_LINE_COLOR), rcText)
                        sValue = dTarget.ToString(ParentControl.PrecisionFormat)
                        szText = g.MeasureString(sValue, ParentControl.Font)
                        iTargetPos1 = iXPos - szText.Width / 2.0
                        iTargetPos2 = iXPos + szText.Width / 2.0
                        g.DrawString(sValue, ParentControl.Font, New SolidBrush(CHART_TARGET_LINE_COLOR), iXPos, iYPos + 5 + szText.Height, fmtSpecLimit)
                    End If
                Else
                    If dLSL <> DOUBLE_NULL_DATA And dUSL <> DOUBLE_NULL_DATA Then
                        iXPos = ptOrigin.X + CInt((((dLSL + (dUSL - dLSL) / 2.0) - XAxisMin) * dRegionWidth) / (XAxisMax - XAxisMin))
                        szText = g.MeasureString("T", ParentControl.Font)
                        iTPos1 = iXPos - szText.Width / 2.0
                        iTPos2 = iXPos + szText.Width / 2.0
                        sValue = dLSL.ToString(ParentControl.PrecisionFormat)
                        szText = g.MeasureString(sValue, ParentControl.Font)
                        iTargetPos1 = iXPos - szText.Width / 2.0
                        iTargetPos2 = iXPos + szText.Width / 2.0
                    End If
                End If

                If dLSL <> DOUBLE_NULL_DATA Then
                    iXPos = ptOrigin.X + CInt(((dLSL - XAxisMin) * dRegionWidth) / (XAxisMax - XAxisMin))
                    iXPos2 = iXPos
                    If iXPos > DrawRegion.Left - 20 And iXPos < DrawRegion.Right + 20 Then
                        g.DrawLine(penSpecLine, iXPos, iYPos, iXPos, iYPos - CInt(dRegionHeight + 10))
                        szText = g.MeasureString("LSL", ParentControl.Font)
                        If iTPos1 <> 0 And iTPos1 < iXPos2 + szText.Width / 2.0 Then
                            iXPos2 = iTPos1 - szText.Width / 2.0
                        End If
                        rcText = New RectangleF(iXPos2 - CInt(szText.Width / 2.0), _
                            iYPos - CInt(dRegionHeight + 10 + szText.Height), _
                            szText.Width, _
                            szText.Height)
                        'g.FillRectangle(Brushes.WhiteSmoke, rcText)
                        g.DrawString("LSL", ParentControl.Font, New SolidBrush(CHART_SPEC_LINE_COLOR), rcText)
                        sValue = dLSL.ToString(ParentControl.PrecisionFormat)
                        szText = g.MeasureString(sValue, ParentControl.Font)
                        If iTargetPos1 <> 0 And iTargetPos1 < iXPos + szText.Width / 2.0 Then
                            iXPos = iTargetPos1 - szText.Width / 2.0
                        End If
                        iLSLPos1 = iXPos - szText.Width / 2.0
                        iLSLPos2 = iXPos + szText.Width / 2.0
                        g.DrawString(sValue, ParentControl.Font, New SolidBrush(CHART_SPEC_LINE_COLOR), iXPos, iYPos + 5 + szText.Height, fmtSpecLimit)
                    End If
                End If

                If dUSL <> DOUBLE_NULL_DATA Then
                    iXPos = ptOrigin.X + CInt(((dUSL - XAxisMin) * dRegionWidth) / (XAxisMax - XAxisMin))
                    iXPos2 = iXPos
                    If iXPos > DrawRegion.Left - 20 And iXPos < DrawRegion.Right + 20 Then
                        g.DrawLine(penSpecLine, iXPos, iYPos, iXPos, iYPos - CInt(dRegionHeight + 10))
                        szText = g.MeasureString("USL", ParentControl.Font)
                        If iTPos2 <> 0 And iTPos2 > iXPos2 - szText.Width / 2.0 Then
                            iXPos2 = iTPos2 + szText.Width / 2.0
                        End If
                        rcText = New RectangleF(iXPos2 - CInt(szText.Width / 2.0), _
                            iYPos - CInt(dRegionHeight + 10 + szText.Height), _
                            szText.Width, _
                            szText.Height)
                        'g.FillRectangle(Brushes.WhiteSmoke, rcText)
                        g.DrawString("USL", ParentControl.Font, New SolidBrush(CHART_SPEC_LINE_COLOR), rcText)
                        sValue = dUSL.ToString(ParentControl.PrecisionFormat)
                        szText = g.MeasureString(sValue, ParentControl.Font)
                        If iTargetPos2 <> 0 And iTargetPos2 > iXPos - szText.Width / 2.0 Then
                            iXPos = iTargetPos2 + szText.Width / 2.0
                        End If
                        iUSLPos1 = iXPos - szText.Width / 2.0
                        iUSLPos2 = iXPos + szText.Width / 2.0
                        g.DrawString(sValue, ParentControl.Font, New SolidBrush(CHART_SPEC_LINE_COLOR), iXPos, iYPos + 5 + szText.Height, fmtSpecLimit)
                    End If
                End If

                Return True

            Catch ex As Exception
                MsgBox("clsHistogram.DrawSpecLine()" & vbCrLf & ex.Message, MsgBoxStyle.Critical)
                Return False
            End Try

        End Function

        Public Function Draw3sLine(ByRef g As Graphics) As Boolean

            Try
                Dim dRegionWidth As Double = DrawRegion.Width
                Dim dRegionHeight As Double = DrawRegion.Height
                Dim ptOrigin As Point = New Point(DrawRegion.Left, DrawRegion.Bottom)
                Dim dMean As Double = ParentControl.DataSet.Mean
                Dim dSigmaLower As Double = dMean - ParentControl.DataSet.StdDev * 3
                Dim dSigmaUpper As Double = dMean + ParentControl.DataSet.StdDev * 3

                Dim penSpecLine As Pen = New Pen(CHART_SIGMA_LINE_COLOR, 1)
                Dim sValue As String = STRING_NULL_DATA
                Dim szText As SizeF = SizeF.Empty
                Dim rcText As RectangleF = RectangleF.Empty
                Dim iXPos As Integer = 0
                Dim iXPos2 As Integer = 0
                Dim iYPos As Integer = 0
                Dim iMeanPos1, iSimgaUpperPos1, iSigmaLowerPos1 As Integer
                Dim iMeanPos2, iSimgaUpperPos2, iSigmaLowerPos2 As Integer
                Dim iMPos1, i3sUpperPos1, i3sLowerPos1 As Integer
                Dim iMPos2, i3sUpperPos2, i3sLowerPos2 As Integer
                iMeanPos1 = 0
                iSimgaUpperPos1 = 0
                iSigmaLowerPos1 = 0
                iMeanPos2 = 0
                iSimgaUpperPos2 = 0
                iSigmaLowerPos2 = 0
                iMPos1 = 0
                i3sUpperPos1 = 0
                i3sLowerPos1 = 0
                iMPos2 = 0
                i3sUpperPos2 = 0
                i3sLowerPos2 = 0

                Dim fmtSigma As StringFormat = New StringFormat
                fmtSigma.Alignment = StringAlignment.Center
                fmtSigma.LineAlignment = StringAlignment.Near

                iYPos = ptOrigin.Y

                iXPos = ptOrigin.X + CInt(((dMean - XAxisMin) * dRegionWidth) / (XAxisMax - XAxisMin))
                If iXPos > DrawRegion.Left - 20 And iXPos < DrawRegion.Right + 20 Then
                    g.DrawLine(penSpecLine, iXPos, iYPos, iXPos, iYPos - CInt(dRegionHeight + 30))
                    szText = g.MeasureString("M", ParentControl.Font)
                    iMPos1 = iXPos - szText.Width / 2.0
                    iMPos2 = iXPos + szText.Width / 2.0
                    rcText = New RectangleF(iXPos - CInt(szText.Width / 2.0), _
                        iYPos - CInt(dRegionHeight + 30 + szText.Height), _
                        szText.Width, _
                        szText.Height)
                    'g.FillRectangle(Brushes.WhiteSmoke, rcText)
                    g.DrawString("M", ParentControl.Font, New SolidBrush(CHART_SIGMA_LINE_COLOR), rcText)
                    sValue = dMean.ToString(ParentControl.PrecisionFormat)
                    szText = g.MeasureString(sValue, ParentControl.Font)
                    iMeanPos1 = iXPos - szText.Width / 2.0
                    iMeanPos2 = iXPos + szText.Width / 2.0
                    If ParentControl.IsViewSpecLimit = True Then
                        g.DrawString(sValue, ParentControl.Font, New SolidBrush(CHART_SIGMA_LINE_COLOR), iXPos, iYPos + 5 + szText.Height * 2, fmtSigma)
                    Else
                        g.DrawString(sValue, ParentControl.Font, New SolidBrush(CHART_SIGMA_LINE_COLOR), iXPos, iYPos + 5 + szText.Height, fmtSigma)
                    End If
                End If

                If ParentControl.DataSet.StdDev = 0 Then
                    Return True
                End If

                iXPos = ptOrigin.X + CInt(((dSigmaLower - XAxisMin) * dRegionWidth) / (XAxisMax - XAxisMin))
                iXPos2 = iXPos
                If iXPos > DrawRegion.Left - 20 And iXPos < DrawRegion.Right + 20 Then
                    g.DrawLine(penSpecLine, iXPos, iYPos, iXPos, iYPos - CInt(dRegionHeight + 30))
                    szText = g.MeasureString("3s", ParentControl.Font)
                    If iMPos1 <> 0 And iMPos1 < iXPos2 + szText.Width / 2.0 Then
                        iXPos2 = iMPos1 - szText.Width / 2.0
                    End If
                    rcText = New RectangleF(iXPos2 - CInt(szText.Width / 2.0), _
                        iYPos - CInt(dRegionHeight + 30 + szText.Height), _
                        szText.Width, _
                        szText.Height)
                    'g.FillRectangle(Brushes.WhiteSmoke, rcText)
                    g.DrawString("3s", ParentControl.Font, New SolidBrush(CHART_SIGMA_LINE_COLOR), rcText)
                    sValue = dSigmaLower.ToString(ParentControl.PrecisionFormat)
                    szText = g.MeasureString(sValue, ParentControl.Font)
                    If iMeanPos1 <> 0 And iMeanPos1 < iXPos + szText.Width / 2.0 Then
                        iXPos = iMeanPos1 - szText.Width / 2.0
                    End If
                    iSigmaLowerPos1 = iXPos - szText.Width / 2.0
                    iSigmaLowerPos2 = iXPos + szText.Width / 2.0
                    If ParentControl.IsViewSpecLimit = True Then
                        g.DrawString(sValue, ParentControl.Font, New SolidBrush(CHART_SIGMA_LINE_COLOR), iXPos, iYPos + 5 + szText.Height * 2, fmtSigma)
                    Else
                        g.DrawString(sValue, ParentControl.Font, New SolidBrush(CHART_SIGMA_LINE_COLOR), iXPos, iYPos + 5 + szText.Height, fmtSigma)
                    End If
                End If

                iXPos = ptOrigin.X + CInt(((dSigmaUpper - XAxisMin) * dRegionWidth) / (XAxisMax - XAxisMin))
                iXPos2 = iXPos
                If iXPos > DrawRegion.Left - 20 And iXPos < DrawRegion.Right + 20 Then
                    g.DrawLine(penSpecLine, iXPos, iYPos, iXPos, iYPos - CInt(dRegionHeight + 30))
                    szText = g.MeasureString("3s", ParentControl.Font)
                    If iMPos2 <> 0 And iMPos2 > iXPos2 - szText.Width / 2.0 Then
                        iXPos2 = iMPos2 + szText.Width / 2.0
                    End If
                    rcText = New RectangleF(iXPos2 - CInt(szText.Width / 2.0), _
                        iYPos - CInt(dRegionHeight + 30 + szText.Height), _
                        szText.Width, _
                        szText.Height)
                    'g.FillRectangle(Brushes.WhiteSmoke, rcText)
                    g.DrawString("3s", ParentControl.Font, New SolidBrush(CHART_SIGMA_LINE_COLOR), rcText)
                    sValue = dSigmaUpper.ToString(ParentControl.PrecisionFormat)
                    szText = g.MeasureString(sValue, ParentControl.Font)
                    If iMeanPos2 <> 0 And iMeanPos2 > iXPos - szText.Width / 2.0 Then
                        iXPos = iMeanPos2 + szText.Width / 2.0
                    End If
                    iSimgaUpperPos1 = iXPos - szText.Width / 2.0
                    iSimgaUpperPos2 = iXPos + szText.Width / 2.0
                    If ParentControl.IsViewSpecLimit = True Then
                        g.DrawString(sValue, ParentControl.Font, New SolidBrush(CHART_SIGMA_LINE_COLOR), iXPos, iYPos + 5 + szText.Height * 2, fmtSigma)
                    Else
                        g.DrawString(sValue, ParentControl.Font, New SolidBrush(CHART_SIGMA_LINE_COLOR), iXPos, iYPos + 5 + szText.Height, fmtSigma)
                    End If
                End If

                Return True

            Catch ex As Exception
                MsgBox("clsHistogram.Draw3sLine()" & vbCrLf & ex.Message, MsgBoxStyle.Critical)
                Return False
            End Try

        End Function

        Public Function DrawNormalLine(ByRef g As Graphics) As Boolean

            Try
                Dim dRegionWidth As Double = DrawRegion.Width
                Dim dRegionHeight As Double = DrawRegion.Height
                Dim ptOrigin As Point = New Point(DrawRegion.Left, DrawRegion.Bottom)

                If ParentControl.DataSet.StdDev <= 0 Then
                    Return True
                End If

                Dim iAxisMin, iAxisMax As Integer
                Dim iYPos As Integer
                Dim dFx, dFy, dNormal As Double
                Dim dWidth, dFirstValue As Double
                Dim ptPos As PointF()

                dWidth = XAxisMax - XAxisMin
                dFirstValue = XAxisMin
                iAxisMin = ptOrigin.X
                iAxisMax = ptOrigin.X + CInt(dRegionWidth)

                Dim iCount As Integer = 0
                Dim i As Integer

                For i = iAxisMin To iAxisMax
                    dFx = (i - iAxisMin) * dWidth / dRegionWidth + dFirstValue
                    dNormal = StatBasic.GetdNormal(dFx, ParentControl.DataSet.Mean, ParentControl.DataSet.StdDev)

                    If dNormal = DOUBLE_NULL_DATA Then
                        Return True
                    End If

                    dFy = dNormal
                    dNormal = StatBasic.GetdNormal(ParentControl.DataSet.Mean, ParentControl.DataSet.Mean, ParentControl.DataSet.StdDev)

                    If dNormal = DOUBLE_NULL_DATA Then
                        Return True
                    End If

                    iYPos = ptOrigin.Y - CInt(dFy * dRegionHeight / dNormal)

                    If iYPos >= ptOrigin.Y Then
                        GoTo NEXT_FOR
                    End If

                    ReDim Preserve ptPos(iCount + 1)
                    ptPos.SetValue(New PointF(i, iYPos), iCount)

                    iCount += 1
NEXT_FOR:
                Next i

                ReDim Preserve ptPos(iCount + 1)
                ptPos.SetValue(New PointF(ptOrigin.X + dRegionWidth, ptOrigin.Y), iCount)
                ptPos.SetValue(New PointF(ptOrigin.X, ptOrigin.Y), iCount + 1)

                Dim solidBrush As SolidBrush = New SolidBrush(Color.FromArgb(100, CHART_NORMAL_LINE_REGION_COLOR))
                g.FillPolygon(solidBrush, ptPos)
                g.DrawPolygon(New Pen(CHART_NORMAL_LINE_COLOR), ptPos)

                Return True

            Catch ex As Exception
                MsgBox("clsHistogram.DrawNormalLine()" & vbCrLf & ex.Message, MsgBoxStyle.Critical)
                Return False
            End Try

        End Function

#End Region

    End Class

End Namespace

